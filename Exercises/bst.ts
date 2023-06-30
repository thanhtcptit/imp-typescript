class TreeNode {
    left: Tree
    value: number
    right: Tree

    constructor(l: Tree, v: number, r: Tree) {
        this.left = l
        this.value = v
        this.right = r
    }
}

class Leaf {}

type Tree = Leaf | TreeNode

function member(x: number, tree: Tree) {
    if (tree instanceof Leaf) return false
    return x == tree.value || member(x, tree.left) || member(x, tree.right)
}

function add(x: number, tree: Tree) {
    if (tree instanceof Leaf) return new TreeNode(new Leaf(), x, new Leaf())
    if (x == tree.value) return tree
    if (x < tree.value) return new TreeNode(add(x, tree.left), tree.value, tree.right)
    return new TreeNode(tree.left, tree.value, add(x, tree.right))
}

function findLargest(tree: Tree) {
    if (tree instanceof Leaf) return -1
    if (tree.right instanceof Leaf) return tree.value
    return findLargest(tree.right)
}

function deleteNode(x: number, tree: Tree) {
    if (tree instanceof Leaf) return tree
    if (tree.right instanceof Leaf) {
        if (x == tree.value) return tree.left
        if (x < tree.value) return new TreeNode(deleteNode(x, tree.left), tree.value, tree.right)
        return tree
    } else {
        let y = findLargest(tree.left)
        if (x == tree.value) return new TreeNode(deleteNode(y, tree.left), y, tree.right)
        if(x < tree.value) return new TreeNode(deleteNode(x, tree.left), tree.value, tree.right)
        return new TreeNode(tree.left, tree.value, deleteNode(x, tree.right))
    }
}

function inorder(tree: Tree) {
    if (tree instanceof Leaf) return []
    return inorder(tree.left).concat([tree.value]).concat(inorder(tree.right))
}

function preorder(tree: Tree) {
    if (tree instanceof Leaf) return []
    return [tree.value].concat(preorder(tree.left).concat(preorder(tree.right)))
}

function postorder(tree: Tree) {
    if (tree instanceof Leaf) return []
    return postorder(tree.left).concat(postorder(tree.right)).concat([tree.value])
}


var tree: Tree = new TreeNode(new TreeNode(new Leaf(), 1, new Leaf()), 3,
    new TreeNode(new TreeNode(new Leaf(), 5, new Leaf()), 6, new TreeNode(new Leaf(), 8, new Leaf())))
var tree_2: Tree = add(4, tree)
var tree_3: Tree = deleteNode(5, tree_2)

console.log(inorder(tree))
console.log(inorder(tree_2))
console.log(inorder(tree_3))
