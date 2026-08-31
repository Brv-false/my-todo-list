const STORAGE_KEY = 'todo.tasks.v1'

// Utilities
const $ = (sel, ctx = document) => ctx.querySelector(sel)
const uid = () => (crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.floor(Math.random()*1e6)}`

let tasks = []

function loadTasks(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY)
    if(!raw) return []
    const parsed = JSON.parse(raw)
    if(!Array.isArray(parsed)) return []
    return parsed.map(normalizeTask)
  }catch(e){
    console.error('Failed to load tasks', e)
    return []
  }
}

function saveTasks(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)) }catch(e){ console.error('Save failed', e) }
}

function normalizeTask(t){
  return {
    id: t.id || uid(),
    text: String(t.text || '').trim(),
    completed: Boolean(t.completed),
    priority: ['low','medium','urgent'].includes(t.priority) ? t.priority : 'low'
  }
}

function renderTasks(){
  const list = $('#tasks')
  list.innerHTML = ''

  tasks.forEach(task => {
    const li = document.createElement('li')
    li.className = 'task-item'
    li.dataset.id = task.id

    const left = document.createElement('div'); left.className = 'task-left'

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'; checkbox.className='task-checkbox'
    checkbox.checked = task.completed
    checkbox.setAttribute('aria-label', `Mark ${task.text} complete`)

    checkbox.addEventListener('change', ()=> toggleComplete(task.id, checkbox.checked))

    const dot = document.createElement('span')
    dot.className = `priority-dot priority-${task.priority}`
    dot.setAttribute('aria-hidden','true')

    const text = document.createElement('div')
    text.className = 'task-text' + (task.completed ? ' completed' : '')
    text.textContent = task.text

    left.appendChild(checkbox)
    left.appendChild(text)
    left.appendChild(dot)

    const del = document.createElement('button')
    del.className = 'delete-btn'
    del.setAttribute('aria-label', `Delete ${task.text}`)
    del.textContent = 'Delete'
    del.addEventListener('click', ()=> removeTask(task.id, li))

    li.appendChild(left)
    li.appendChild(del)
    list.appendChild(li)
  })

  updateCounts()
}

function addTask(text, priority='low'){
  const trimmed = String(text||'').trim()
  if(!trimmed) return false
  const task = normalizeTask({id: uid(), text: trimmed, completed:false, priority})
  tasks.unshift(task)
  saveTasks(); renderTasks();
  return true
}

function toggleComplete(id, completed){
  const t = tasks.find(x=>x.id===id); if(!t) return
  t.completed = !!completed
  saveTasks(); renderTasks()
}

function removeTask(id, el){
  const idx = tasks.findIndex(x=>x.id===id); if(idx===-1) return
  // animate then remove
  el.classList.add('removing')
  setTimeout(()=>{
    tasks.splice(idx,1); saveTasks(); renderTasks()
  },220)
}

function updateCounts(){
  const completed = tasks.filter(t=>t.completed).length
  const incomplete = tasks.length - completed
  $('#completedCount').textContent = String(completed)
  $('#incompleteCount').textContent = String(incomplete)
}

function bind(){
  const form = $('#taskForm')
  const input = $('#taskInput')
  const select = $('#prioritySelect')

  form.addEventListener('submit', (e)=>{
    e.preventDefault()
    const ok = addTask(input.value, select.value)
    if(ok){ input.value=''; input.focus(); select.value='low' }
  })

  // keyboard accessibility for delete via Enter when focused
  document.addEventListener('keydown', (e)=>{
    if(e.key==='Enter' && document.activeElement && document.activeElement.classList.contains('delete-btn')){
      document.activeElement.click()
    }
  })
}

// Init
document.addEventListener('DOMContentLoaded', ()=>{
  tasks = loadTasks()
  bind()
  renderTasks()
})
