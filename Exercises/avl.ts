class TreeNode {
    left: AVLTree
    value: number
    right: AVLTree
    depth: number

    constructor(l: AVLTree, v: number, r: AVLTree, d: number) {
        this.left = l
        this.value = v
        this.right = r
        this.depth = d
    }
}

class Leaf {}

type AVLTree = Leaf | TreeNode

function depth(tree: AVLTree) {
    if (tree instanceof Leaf) return 0
    return tree.depth
}

function createNode(left: AVLTree, x: number, right: AVLTree) {
    let d = 1 + Math.max(depth(left), depth(right))
    return new TreeNode(left, x, right, d)
}

function slope(tree: AVLTree) {
    if (tree instanceof Leaf) return 0
    return depth(tree.left) - depth(tree.right)
}

function rotl(tree: AVLTree) {
    let right_node = tree.right
    return createNode(
        createNode(tree.left, tree.value, right_node.left),
        right_node.value, right_node.right
    )
}

function rotr(tree: AVLTree) {
    let left_node = tree.left
    return createNode(
        left_node.left, left_node.value,
        createNode(left_node.right, tree.value, tree.right)
    )
}

function shiftl(tree: AVLTree) {
    if (slope(tree.right) == 1) return rotl(new TreeNode(
        tree.left, tree.value, rotr(tree.right), tree.depth))
    return rotl(tree)
}

function shiftr(tree: AVLTree) {
    if (slope(tree.left) == -1) return rotr(new TreeNode(
        rotl(tree.left), tree.value, tree.right, tree.depth))
    return rotr(tree)
}

function rebalance(tree: AVLTree) {
    if (slope(tree) == 2) return shiftr(tree)
    if (slope(tree) == -2) return shiftl(tree)
    return tree
}

function add(x: number, tree: AVLTree) {
    if (tree instanceof Leaf) return new TreeNode(new Leaf(), x, new Leaf(), 1)
    if (x == tree.value) return tree
    if(x < tree.value) return rebalance(createNode(add(x, tree.left), tree.value, tree.right))
    return rebalance(createNode(tree.left, tree.value, add(x, tree.right)))
}

function findLargest(tree: AVLTree) {
    if (tree instanceof Leaf) return -1
    if (tree.right instanceof Leaf) return tree.value
    return findLargest(tree.right)
}

function deleteNode(x: number, tree: AVLTree) {
    if (tree instanceof Leaf) return tree
    if (tree.right instanceof Leaf) {
        if (x == tree.value) return tree.left
        if (x < tree.value) return rebalance(
            createNode(deleteNode(x, tree.left), tree.value, tree.right))
        return tree
    } else {
        let y = findLargest(tree.left)
        if (x == tree.value) return rebalance(
            createNode(deleteNode(y, tree.left), y, tree.right))
        if (x < tree.value) return rebalance(
            createNode(deleteNode(x, tree.left), tree.value, tree.right))
        return rebalance(createNode(tree.left, tree.value, deleteNode(x, tree.right)))
    }
}

function inorder(tree: AVLTree) {
    if (tree instanceof Leaf) return []
    return inorder(tree.left).concat([tree.value]).concat(inorder(tree.right))
}


var arr = [1, 2, 3, 4, 5, 6, 7, 8]
var tree: AVLTree = new Leaf()
arr.forEach(element => {
    tree = add(element, tree)
});

console.log(inorder(tree))
console.log(slope(tree))

tree = deleteNode(3, tree)
console.log(inorder(tree))
console.log(slope(tree))
