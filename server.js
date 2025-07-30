//Importing Essentials
const express = require('express');
const path = require('path');
const fs = require('fs');
const {v4:uuidv4} = require('uuid');
const methodOverride = require('method-override');

//Assigning some Constants
const FILE_PATH = path.join(__dirname,"data.json");
const PORT = 8000;

//Some Useful Functions
function getData(){
    try {
        const rawData = fs.readFileSync(FILE_PATH,'utf-8');
        return JSON.parse(rawData);
    } catch (error) {
        // If the file doesn't exist or is invalid JSON, log the error
        // and return a default structure to prevent the app from crashing.
        console.error("Error reading or parsing data.json:", error);
        return { tasks: [], completedTasks: [] };
    }
}
function addData(data){

    fs.writeFileSync(FILE_PATH,JSON.stringify(data,null,2),'utf-8');
}

//Running server
const app = express();
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));

//Using appropriate middlewares
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(methodOverride('_method'));

//Routes
app.get('/',(req,res)=>{
    const {tasks} = getData();
    res.render('home',{tasks});
});
app.post('/add-task',(req,res)=>{
    const {taskTitle, taskDesc} = req.body;
    // First, check if taskTitle exists, then check if it's empty after trimming.
    // This prevents a TypeError if taskTitle is undefined.
    if(!taskTitle || !taskTitle.trim()){
        return res.send("Title Should not be Empty");
    }
    const data = getData();
    data.tasks.push({ title: taskTitle, desc: taskDesc, id: uuidv4() });
    addData(data);
    res.redirect('/');
});
app.get('/view-details/:id',(req,res)=>{
    const {id} = req.params;
    const {tasks} = getData();
    // Use the .find() method to search the array for a matching ID
    const task = tasks.find(t => t.id === id);

    if (task) {
        // If the task is found, render a new details page for it
        res.render('details', { task });
    } else {
        // If no task with that ID is found, send a 404 error
        res.status(404).send('Task not found');
    }
});
app.get('/edit-task/:id',(req,res)=>{
    const {id} = req.params;
    const {tasks} = getData();
    const task = tasks.find(t=>t.id==id);
    if(task){
        res.render('editTask',{task});
    } else {
        res.status(404).sendStatus('Task Not Valid');
    }
});
app.patch('/edit-task/:id', (req, res) => {
    const { id } = req.params;
    const { taskTitle, taskDesc } = req.body;
    const data = getData();

    // Find the index of the task to update
    const taskIndex = data.tasks.findIndex(t => t.id === id);

    if (taskIndex !== -1) {
        // Update the task properties
        data.tasks[taskIndex].title = taskTitle;
        data.tasks[taskIndex].desc = taskDesc;
        addData(data);
        // Redirect back to the details page to see the changes
        res.redirect(`/view-details/${id}`);
    } else {
        res.status(404).send('Task not found for update');
    }
});
app.delete('/delete-task/:id',(req,res)=>{
    const {id} = req.params;
    // Get the full data object
    const data = getData();
    // Filter the tasks array, keeping all tasks that DON'T match the ID
    data.tasks = data.tasks.filter(t => t.id !== id);
    // Save the modified data object back to the file
    addData(data);
    res.redirect('/');
});
app.post('/task-done/:id',(req,res)=>{
    const {id} = req.params;
    const data = getData();
    const task = data.tasks.find(t=>t.id==id);
    if(!task){
        return res.status(404).send("Task not Found");
    }
    data.completedTasks.push(task);
    data.tasks = data.tasks.filter(t=> t.id!==id);
    addData(data);
    res.redirect('/');
});
app.get('/completed-tasks',(req,res)=>{
    const {completedTasks} = getData();
    res.render('completed',{completedTasks});
})
app.post('/revert/:id',(req,res)=>{
    const {id} = req.params;
    const data = getData();
    const task = data.completedTasks.find(t=>t.id==id);
    if(!task){
        return res.status(404).send("Task not Found");
    }
    data.tasks.push(task);
    data.completedTasks = data.completedTasks.filter(t=>t.id!==id);
    addData(data);
    res.redirect('/completed-tasks');
});
app.delete('/completed-tasks/delete/:id',(req,res)=>{
    const {id} = req.params;
    const data = getData();
    const task = data.completedTasks.find(t=>t.id==id);
    if(!task){
        return res.status(404).send("Task Not Found");
    }
    data.completedTasks = data.completedTasks.filter(t=>t.id!==id);
    addData(data);
    res.redirect('/completed-tasks');
})
//setting up server on port
app.listen(PORT,()=>{console.log(`Server is Open on PORT ${PORT}`);})
