function solver(results: Array<Array<number>>, board: Array<Array<number>>, row: number,
                col_mask: number, main_diag: number, anti_diag: number) {
    let N: number = board.length
    let mask: number = (1 << N) - 1

    if (col_mask == mask) {
        let res: Array<number> = []
        for (let i = 0; i < board.length; i++)
            for (let j = 0; j < board[i].length; j++) {
                if (board[i][j] == 1) res.push(j)
            }
        results.push(res)
    }

    let avail_mask = mask & (~(col_mask | main_diag | anti_diag))
    while (avail_mask > 0) {
        let i: number = avail_mask & (-avail_mask)
        let col: number = Math.floor(Math.log2(i))
        board[row][col] = 1

        solver(results, board, row + 1, col_mask | i, (main_diag | i) << 1, (anti_diag | i) >> 1)
        avail_mask = avail_mask & (avail_mask - 1)
        board[row][col] = 0
    }
}

function printSol(sol: Array<number>) {
    for (let i = 0; i < sol.length; i++) {
        let s: Array<string> = Array(sol.length).fill(".")
        s[sol[i]] = "Q"
        console.log(s.join(" "))
    }
    console.log("==================================")
}

var N = 8
var board: Array<Array<number>> = []
for (let i = 0; i < N; i++) {
    let row: Array<number> = []
    for (let j = 0; j < N; j++) row.push(0)
    board.push(row)
}

var results: Array<Array<number>> = []
solver(results, board, 0, 0, 0, 0)
results.forEach(element => {
    printSol(element)
})
