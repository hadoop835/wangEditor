import Editor from '../../../editor/index'
import $ from '../../../utils/dom-core'
import { isTodo, isAllTodo } from '../util'
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

            // const testNode = $(`<b><i><span>test132</span><span>232333</span></i><span>12345678</span><span>xxd</span>dddd</b>`).getNode()
            // // const txt = $(testNode).childNodes()?.getNode(1).childNodes[0] as Node
            // const txt = $(testNode).childNodes()?.childNodes()?.get(1).getNode().childNodes[0] as Node
            // console.log(txt)

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
     * todo的自定义删除事件
     * @param e 事件属性
     */
    function todoDel(e: Event) {
        const $topSelectElem = editor.selection.getSelectionRangeTopNodes(editor)[0]
        if (isTodo($topSelectElem)) {
            if ($topSelectElem.text() === '') {
                console.log($topSelectElem)
                e.preventDefault()
                const $p = $(`<p><br></p>`)
                $p.insertAfter($topSelectElem)
                editor.selection.saveRange()
                // 兼容firefox下光标位置问题
                editor.selection.moveCursor($p.getNode())
                $topSelectElem.remove()
            }
        }
    }

    /**
     * 删除事件up时，对处于第一行的todo进行特殊处理
     */
    function delUp() {
        const $topSelectElem = editor.selection.getSelectionRangeTopNodes(editor)[0]
        const nodeName = $topSelectElem.getNodeName()
        if (nodeName === 'UL') {
            if ($topSelectElem.text() === '' && !isTodo($topSelectElem)) {
                $(`<p><br></p>`).insertAfter($topSelectElem)
                $topSelectElem.remove()
            }
        }
    }

    editor.txt.eventHooks.enterDownEvents.push(todoEnter)
    editor.txt.eventHooks.deleteDownEvents.push(todoDel)
    editor.txt.eventHooks.deleteUpEvents.push(delUp)
}

/**
 *
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
