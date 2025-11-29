import './App.css'
import { useState, useEffect } from 'react';
import { supabase } from './services/supabase-client';

interface Tasks {
  id: number;
  created_at: string;
  title: string;
  description: string;
}

export default function App() {
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [tasks, setTask] = useState<Tasks[]>([]);
  const [newDescription, setNewDescription] = useState("");

  // Set browser tab title
  useEffect(() => {
    document.title = "Task Manager CRUD App";
  }, []);

  // READ TASKS
  const ReadTask = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error reading tasks:", error.message);
      return;
    }

    setTask(data);
  };

  // CREATE TASK
  const CreateTask = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase
      .from('tasks')
      .insert([newTask]) // ✅ insert expects array
      .single();

    if (error) {
      console.error("Error creating task:", error.message);
      return;
    }

    setNewTask({ title: "", description: "" }); // ✅ clear input
    await ReadTask(); // ✅ refresh list
  };

  // UPDATE TASK
  const UpdateTask = async (id: number) => {
    const { error } = await supabase
      .from('tasks')
      .update({ description: newDescription })
      .eq('id', id);

    if (error) {
      console.error("Error updating task:", error.message);
      return;
    }

    setNewDescription("");
    await ReadTask();
  };

  // DELETE TASK
  const DeleteTask = async (id: number) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting task:", error.message);
      return;
    }

    await ReadTask();
  };

  // LOAD TASKS ONCE
  useEffect(() => {
    ReadTask();
  }, []);

  // (Optional) Real-time updates for Supabase
  useEffect(() => {
    const channel = supabase
      .channel('realtime-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        ReadTask();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <>
      <h1>Ortega Task Manager CRUD</h1>

      {/* ADD TASK FORM */}
      <form onSubmit={CreateTask}>
        <input
          type="text"
          placeholder="Title Here"
          value={newTask.title}
          onChange={(e) =>
            setNewTask((prev) => ({ ...prev, title: e.target.value }))
          }
          required
        />
        <textarea
          placeholder="Description Here"
          value={newTask.description}
          onChange={(e) =>
            setNewTask((prev) => ({ ...prev, description: e.target.value }))
          }
          required
        />
        <button type="submit">Add Task</button>
      </form>

      {/* TASK LIST */}
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <div>
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              <textarea
                placeholder="Edit Description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
              <button onClick={() => UpdateTask(task.id)}>Update</button>
              <button onClick={() => DeleteTask(task.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
