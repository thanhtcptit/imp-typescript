var args = process.argv

var x : number = +args[2]
var y : number = +args[3]

function gcd(x: number, y: number) {
    if (y == 0) return x
    else if (y > x) return gcd(y, x)
    else return gcd(x - y, y)
}
console.log(gcd(x, y))