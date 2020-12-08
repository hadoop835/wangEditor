import { DomElement } from '../../utils/dom-core'
import Editor from '../../editor'

/**
 * 判断传入的单行顶级选区选取是不是todo
 * @param editor 编辑器对象
 */
function isTodo($topSelectElem: DomElement) {
    const topName = $topSelectElem?.getNodeName()
    if (topName === 'UL') {
        // input所在的dom节点位置
        const childName = $topSelectElem.childNodes()?.childNodes()?.childNodes()?.getNodeName()
        return childName === 'INPUT'
    }
}
/**
 * 判断选中的内容是不是都是todo
 * @param editor 编辑器对象
 */
function isAllTodo(editor: Editor) {
    const $topSelectElems = editor.selection.getSelectionRangeTopNodes(editor)
    // 排除为[]的情况
    if ($topSelectElems.length === 0) return

    return $topSelectElems.every($topSelectElem => {
        const topName = $topSelectElem?.getNodeName()
        if (topName === 'UL') {
            // input所在的dom节点位置
            const childName = $topSelectElem.childNodes()?.childNodes()?.childNodes()?.getNodeName()
            return childName === 'INPUT'
        }
    })
}

/**
 * 根据所在的文本节点和光标在文本节点的位置获取截断的后节点内容
 * @param node 顶级节点
 * @param textNode 光标所在的文本节点
 * @param pos 光标在文本节点的位置
 */
function getNewNode(node: Node, textNode: Node, pos: number): Node | undefined {
    if (!node.hasChildNodes()) return

    const newNode = node.cloneNode() as ChildNode
    let end = false
    if (textNode.nodeValue === '') {
        end = true
    }

    let delArr: Node[] = []
    node.childNodes.forEach(v => {
        //选中后
        if (!v.contains(textNode) && end) {
            newNode.appendChild(v.cloneNode(true))
            delArr.push(v)
        }
        // 选中
        if (v.contains(textNode)) {
            if (v.nodeType === 1) {
                const childNode = getNewNode(v, textNode, pos) as Node
                if (childNode.textContent !== '') newNode?.appendChild(childNode)
            }
            if (v.nodeType === 3) {
                if (textNode.isEqualNode(v)) {
                    const textContent = dealTextNode(v, pos)
                    newNode.textContent = textContent
                } else {
                    newNode.textContent = v.nodeValue
                }
            }
            end = true
        }
    })
    // 删除选中后原来的节点
    delArr.forEach(v => {
        const node = v as ChildNode
        node.remove()
    })

    return newNode
}

/**
 * 获取新的文本节点
 * @param node 要处理的文本节点
 * @param pos  光标在文本节点所在的位置
 */
function dealTextNode(node: Node, pos: number) {
    let content = node.nodeValue
    let oldContent = content?.slice(0, pos) as string
    content = content?.slice(pos) as string
    node.nodeValue = oldContent
    return content
}

export { getNewNode, isTodo, isAllTodo }
