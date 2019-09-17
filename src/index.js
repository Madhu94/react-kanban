import React, { useContext } from "react";
import ReactDOM from "react-dom";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import Html5Backend from "react-dnd-html5-backend";

import "./styles.css";

const ItemTypes = {
  TASK: "task"
};

const BoardActions = {
  ADD: "add",
  REMOVE: "move"
};

function Panel(props) {
  const [, drop] = useDrop({
    accept: ItemTypes.TASK,
    drop: item => {
      updateBoards({
        type: BoardActions.ADD,
        payload: { taskname: item.name, to: props.title }
      });
    },
    collect: (monitor, props) => {
      return props;
    }
  });
  const children = props.tasks.map(task => {
    if (typeof task === "string") {
      return <Task taskname={task} />;
    } else if (task.type === "placeholder") {
      return <PlaceholderTask />;
    }
    return null;
  });
  return (
    <div
      className="board"
      ref={drop}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <div> {props.title} </div>
      <div className="board-dropzone">{children}</div>
    </div>
  );
}

function Task(props) {
  const [, drag] = useDrag({
    item: { type: ItemTypes.TASK, name: props.taskname }
  });
  const [, drop] = useDrop({
    accept: ItemTypes.TASK,
    hover: (item, monitor) => {
      if (item.name === props.taskname) {
        return;
      }
      if (item.type === ItemTypes.TASK) {
        addPlaceHolderBeforeBoard(props.taskname);
      }
    }
  });
  const combinedRef = ref => {
    drag(ref);
    drop(ref);
  };
  return (
    <div
      ref={combinedRef}
      style={{
        backgroundColor: "yellow",
        margin: "5px",
        padding: "20px",
        height: "10px"
      }}
      className="task"
    >
      {props.taskname}
    </div>
  );
}

function PlaceholderTask(props) {
  return (
    <div
      style={{
        backgroundColor: "yellow",
        border: "dashed black 0.2px",
        margin: "5px",
        padding: "20px",
        height: "10px"
      }}
    />
  );
}

const TaskContext = React.createContext({ boards: [] });
let boards = [
  {
    name: "Todo",
    tasks: [
      "Learn HTML",
      "Learn SQL",
      "Learn Auth",
      "Learn JS",
      "Something else"
    ]
  },
  { name: "Done", tasks: [] }
];

function App() {
  const { boards: bds } = useContext(TaskContext);
  const panels = bds.map(({ name, tasks = [] }) => {
    return <Panel title={name} tasks={tasks} />;
  });
  return (
    <DndProvider backend={Html5Backend}>
      <div className="App">{panels}</div>
    </DndProvider>
  );
}

function addPlaceHolderBeforeBoard(taskname) {
  const board = boards.find(({ tasks }) => {
    return tasks.includes(taskname);
  });
  board.tasks = board.tasks.filter(task => {
    return !(task.type && task.type === "placeholder");
  });
  const index = board.tasks.findIndex(task => task === taskname);
  board.tasks.splice(index, 0, { name: "placeholder", type: "placeholder" });
  render();
}

function updateBoards(boardAction) {
  // a weird precursor to using redux
  // We have only one action now - 'MOVE'
  if (boardAction.type === BoardActions.ADD) {
    const { to, taskname } = boardAction.payload;
    const theBoard = boards.find(({ tasks }) => tasks.includes(taskname));
    if (theBoard.name === to) {
      return;
    }
    boards = boards.map(board => {
      if (board.name === to) {
        const taskIndex = board.tasks.findIndex(
          task => task.type && task.type === "placeholder"
        );
        let tasks = board.tasks.slice();
        if (taskIndex !== -1) {
          tasks.splice(taskIndex, 1, taskname);
        } else {
          tasks = [...tasks, taskname];
        }
        return { ...board, tasks };
      }
      return {
        ...board,
        tasks: board.tasks.filter(task => {
          return task !== taskname;
        })
      };
    });
  }

  if (boardAction.type === BoardActions.REMOVE) {
    const { from, taskname } = boardAction.payload;
    boards = boards.map(board => {
      if (board.name === from) {
        const tasks = board.tasks.filter(task => {
          return task !== taskname;
        });
        return { ...board, tasks };
      }
      return board;
    });
  }
  render();
}

function render() {
  const rootElement = document.getElementById("root");
  ReactDOM.render(
    <TaskContext.Provider value={{ boards, updateBoards }}>
      <App />
    </TaskContext.Provider>,
    rootElement
  );
}

render();
