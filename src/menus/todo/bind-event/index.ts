import Editor from '../../../editor/index'
import $ from '../../../utils/dom-core'
import { isAllTodo } from '../util'
import createTodo from '../todo'

/**
 * todolist 内部逻辑
 * @param editor
 */
function bindEvent(editor: Editor) {
    /**
     * todo的自定义回车事件
     * @param e 事件属性
     */
    function todoEnter(e: Event) {
        // 判断是否为todo节点
        if (isAllTodo(editor)) {
            e.preventDefault()

            const $topSelectElem = editor.selection.getSelectionRangeTopNodes(editor)[0]
            const $li = $topSelectElem.childNodes()?.get(0)
            const selectionNode = window.getSelection()?.anchorNode as Node

            // 回车时内容为空时，删去此行
            if ($topSelectElem.text() === '') {
                const $p = $(`<p><br></p>`)
                $p.insertAfter($topSelectElem)
                editor.selection.moveCursor($p.getNode())
                $topSelectElem.remove()
                return
            }

            const pos = editor.selection.getCursorPos() as number
            const newNode = getNewNode($li?.getNode() as Node, selectionNode, pos)
            const todo = createTodo($(newNode))
            const $inputcontainer = todo.getInputContainer()
            const $newTodo = todo.getTodo()
            // 处理光标在最前面时回车input不显示的问题
            if ($li?.text() === '') {
                $li?.append($(`<br>`))
            }
            $newTodo.insertAfter($topSelectElem)
            // 处理光标在最后面的，input不显示的问题(必须插入之后移动光标)
            if (!$inputcontainer.getNode().nextSibling) {
                const $br = $(`<br>`)
                console.log($($inputcontainer))
                $br.insertAfter($inputcontainer)
                editor.selection.moveCursor($inputcontainer.parent().getNode())
            } else {
                editor.selection.moveCursor($newTodo.getNode())
            }
        }
    }

    /**
     * 自定义删除事件，用来处理光标在最前面删除input产生的问题
     */
    function delDown() {
        if (isAllTodo(editor)) {
            const $topSelectElem = editor.selection.getSelectionRangeTopNodes(editor)[0]
            const $li = $topSelectElem.childNodes()?.getNode()
            const $p = $(`<p></p>`)
            const p = $p.getNode()
            const selectionNode = window.getSelection()?.anchorNode as Node
            const pos = editor.selection.getCursorPos()
            const prevNode = selectionNode.previousSibling
            if (
                prevNode?.nodeName === 'SPAN' &&
                prevNode.childNodes[0].nodeName === 'INPUT' &&
                pos === 0
            ) {
                $li?.childNodes.forEach((v, index) => {
                    if (index === 0) return
                    p.appendChild(v.cloneNode(true))
                })
                $p.insertAfter($topSelectElem)
                $topSelectElem.remove()
            }
        }
    }
    editor.txt.eventHooks.enterDownEvents.push(todoEnter)
    editor.txt.eventHooks.deleteDownEvents.push(delDown)
}

/**
 *  获取截断后的新节点
 * @param node 顶级节点
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
        //     //选中后
        if (!v.contains(textNode) && end) {
            newNode.appendChild(v.cloneNode(true))
            delArr.push(v)
        }
        //     // 选中
        if (v.contains(textNode)) {
            if (v.nodeType === 1) {
                const childNode = getNewNode(v, textNode, pos) as Node
                if (childNode) newNode?.appendChild(childNode)
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
 * @param node
 * @param pos
 */
function dealTextNode(node: Node, pos: number) {
    let content = node.nodeValue
    let oldContent = content?.slice(0, pos) as string
    content = content?.slice(pos) as string
    node.nodeValue = oldContent
    return content
}

export default bindEvent
