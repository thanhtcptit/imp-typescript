function insert(x: number, arr: Array<number>) {
    if (arr.length == 0) return [x]
    if (x < arr[0]) return [x].concat(arr)
    return [arr[0]].concat(insert(x, arr.slice(1)))
}

function isort(arr: Array<number>) {
    if (arr.length == 0) return []
    return insert(arr[0], isort(arr.slice(1)))
}


var arr = Array(20).fill(0).map(() => Math.round(Math.random() * 100))
console.log(arr)
console.log(isort(arr))