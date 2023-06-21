var args = process.argv;
var x = +args[2];
var y = +args[3];
console.log(x);
function gcd(x, y) {
    if (y == 0)
        return x;
    else if (y > x)
        return gcd(y, x);
    else
        return gcd(x - y, y);
}
console.log(gcd(x, y));
