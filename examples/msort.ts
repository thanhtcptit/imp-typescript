function insert(x: number, arr: Array<number>) {
    if (arr.length == 0) return [x]
    if (x < arr[0]) return [x].concat(arr)
    return [arr[0]].concat(insert(x, arr.slice(1)))
}

function merge(arr1: Array<number>, arr2: Array<number>) {
    if (arr1.length == 0) return arr2
    return merge(arr1.slice(1), insert(arr1[0], arr2))
}

function split(arr: Array<number>) {
    if (arr.length == 0) return [[], []]
    if (arr.length == 1) return [arr, []]
    let tmp = split(arr.slice(2))
    return [[arr[0]].concat(tmp[0]), [arr[1]].concat(tmp[1])]
}

function msort(arr: Array<number>) {
    if (arr.length == 0) return []
    if (arr.length == 1) return arr
    let tmp = split(arr)
    return merge(msort(tmp[0]), msort(tmp[1]))
}


var arr = Array(20).fill(0).map(() => Math.round(Math.random() * 100))
console.log(arr)
console.log(msort(arr))