function gcd(x: number, y: number) {
    if (y == 0) return x
    if (y > x) return gcd(y, x)
    return gcd(x - y, y)
}


var args = process.argv

var x: number = +args[2]
var y: number = +args[3]
console.log(gcd(x, y))