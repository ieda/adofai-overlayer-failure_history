//History of failure count at each tiles

// 失敗したタイルの番号と失敗回数を表示します。
// F4を押すと履歴を消去できます。
// Displays the number of failed tiles and the number of failures.
// Press F4 to clear the history.
// 실패한 타일 수와 실패 수를 표시합니다.
// F4를 눌러 기록을 지 웁니다.

// 変更履歴
// v0.7.0 2023-01-22 Overlayer 1.33.0 で追加されたタグ登録方法に対応。
// v0.6.1 2023-01-19 プレイ中譜面の判別ロジックを厳密化。
// v0.6.0 2023-01-13 表示件数を超えた分のタイル数と失敗数の合計表示を追加、表示する履歴が無い時は---を表示するようにした。
// v0.5.2 2023-01-08 数式ミスを修正した。
// v0.5.1 2023-01-08 回数表示を()囲みにした。
// v0.5.0 2023-01-08 現在位置から先のタイル10件分だけ表示するようにした。
// v0.4.0 2023-01-08 現在位置より前のタイル番号を隠すようにした。
// v0.3.0 2023-01-08 タイル番号ごとに改行するようにした。
// v0.2.0 2023-01-07 カスタムタグ名（ファイル名）を変更した。
// v0.1.4 2023-01-07 英語と韓国語の説明を追加した。
// v0.1.3 2023-01-06 F4を押すと履歴を消去できるようにした。
// v0.1.2 2023-01-06 失敗回数が1回なら回数表示を省略するようにした。
// v0.1.1 2023-01-06 コードをきれいにした。
// v0.1.0 2023-01-06 初リリース。

// 履歴の表示件数
const MaxShowCount = 10;

const GV_RECORDS = "fh__records";
const GV_FLAG_FIRST_UPDATE_AFTER_FAILED = "fh__flag_fuaf";
const GV_CURRENT_LEVEL = "fh__current_Level";

function getReachTileNumber() {
    if (tiles != undefined) {
        let sid = StartTile();
        if (tiles.count >= 1) {
            sid = tiles.get(tiles.count - 1).getSeqID() + 1;
        }
        return sid;
    }
    return 0;
}

function isInFailedScreen() {
    return FailCount() > 0;
}

function recordFail(seqId) {
    let r = Overlayer.getGlobalVariable(GV_RECORDS);
    if (r == undefined) {
        Overlayer.setGlobalVariable(GV_RECORDS, {});
        r = Overlayer.getGlobalVariable(GV_RECORDS);
    }
    if (r[seqId] == undefined) {
        r[seqId] = 1;
    }
    else {
        r[seqId] += 1;
    }
}

function compareAsNumberAsc(a, b) {
    return parseInt(a) - parseInt(b);
}

function getFailRecords() {
    let resultString = "";
    let records = Overlayer.getGlobalVariable(GV_RECORDS);
    const sortedKeys = Object.keys(records).sort(compareAsNumberAsc);
    let showCount = 0;
    let skipCount = 0;
    for (let i = 0; i < sortedKeys.length; i++) {
        let k = sortedKeys[i];
        if (k < CurTile() - 1) {
            skipCount++;
            continue;
        }
        if (records[k] == 1) {
            resultString += "" + k + "\n";
        }
        else {
            resultString += "" + k + "(" + records[k] + ")" + "\n";
        }
        showCount++;
        if (showCount >= MaxShowCount) {
            let omittedTilesCount = sortedKeys.length - skipCount - MaxShowCount;
            if (omittedTilesCount > 0) {
                let omittedFailsTotal = 0;
                for (let j = i + 1; j < sortedKeys.length; j++) {
                    omittedFailsTotal += records[sortedKeys[j]];
                }
                resultString += "+" + omittedTilesCount + "(" + omittedFailsTotal + ")";
            }
            break;
        }
    }
    if (resultString == "") {
        resultString = "---";
    }
    return resultString;
}

function resetFailRecords() {
    Overlayer.setGlobalVariable(GV_RECORDS, {});
}

function isFirstUpdateAfterFailed() {
    let a = Overlayer.getGlobalVariable(GV_FLAG_FIRST_UPDATE_AFTER_FAILED);
    if (a == false) {
        return true;
    }
    return false;
}

function flagOffFirstUpdateAfterFailed() {
    Overlayer.setGlobalVariable(GV_FLAG_FIRST_UPDATE_AFTER_FAILED, false);
}

function flagOnFirstUpdateAfterFailed() {
    Overlayer.setGlobalVariable(GV_FLAG_FIRST_UPDATE_AFTER_FAILED, true);
}

function generateCurrentPlayingLevelId() {
    // 公式譜面だとTotalTile以外はnullになる
    return `${TotalTile()}${Title()}${Artist()}${Author()}`
}

function setCurrentPlayingLevel() {
    Overlayer.setGlobalVariable(GV_CURRENT_LEVEL, generateCurrentPlayingLevelId());
}

function getCurrentPlayingLevel() {
    return Overlayer.getGlobalVariable(GV_CURRENT_LEVEL);
}

function isChangedPlayingLevel() {
    return getCurrentPlayingLevel() != generateCurrentPlayingLevelId();
}

function isPressedKeyResetRecords() {
    return Input.getKeyDown(KeyCode.F4);
}

function failureHistory() {
    const msg = "";

    if (isChangedPlayingLevel() || isPressedKeyResetRecords()) {
        resetFailRecords();
        setCurrentPlayingLevel();
    }
    // Player.logに無用な出力を避けるための分岐
    if (tiles != undefined && tiles.count >= 0) {
        if (isInFailedScreen()) {
            if (isFirstUpdateAfterFailed()) {
                flagOnFirstUpdateAfterFailed();
                recordFail(getReachTileNumber());
                Overlayer.log("FailureHistory: fail recoreded.");
            }
            return msg + getFailRecords();
        } else {
            flagOffFirstUpdateAfterFailed();
            return msg + getFailRecords();
        }
    }
}

Overlayer.registerTag("FailureHistory", failureHistory);
