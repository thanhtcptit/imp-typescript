function qsort(arr: Array<number>) {
    if (arr.length == 0) return []
    let anchor: number = arr[0]
    let left: Array<number> = []
    let right: Array<number> = []
    arr.slice(1).forEach(ele => {
        if (ele < anchor) left.push(ele)
        else right.push(ele)
    });
    return qsort(left).concat([anchor]).concat(qsort(right))
}


var arr = Array(20).fill(0).map(() => Math.round(Math.random() * 100))
console.log(arr)
console.log(qsort(arr))