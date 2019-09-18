import React from "react";
import ReactDOM from "react-dom";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import Html5Backend from "react-dnd-html5-backend";
import {connect, Provider} from "react-redux";
import {createStore} from "redux";

import "./styles.css";

const ItemTypes = {
  TASK: 'task'
};

const BoardActions = {
  ADD: 'add',
  REMOVE: 'remove'
};

const initState = {
  boards: [
    {name: 'TODO', tasks: ['Add a task...', 'Learn Forms', 'Learn JS', 'Learn more']},
    {name: 'DONE', tasks: []}
  ]
}

function addTask(state, action) {
  const {to, task} = action.payload;
  const boards = state.boards.map((board) => {
    if (board.name === to) {
      const position = action.payload.position || board.tasks.length;
      const tasks = [...board.tasks.slice(0, position), task, ...board.tasks.slice(position)];
      return {...board, tasks};
    }
    return board;
  });
  return {...state, boards};
}

function removeTask(state, action) {
  const {from, task} = action.payload;
  const boards = state.boards.map((board) => {
    if (board.name === from) {
      return {...board, tasks: board.tasks.filter((taskname) => task !== taskname)};
    }
    return board;
  });
  return {...state, boards};
}

function createAddTask(board, task) {
  return {type: BoardActions.ADD, payload: {to: board, task}};
}

function createRemoveTask(board, task) {
  return {
    type: BoardActions.REMOVE,
    payload: {from: board, task}
  };
}

function rootReducer(state, action) {
  switch(action.type) {
    case BoardActions.ADD:
      return addTask(state, action);
    case BoardActions.REMOVE:
      return removeTask(state, action);
    default:
      return state;
  }
}

function Panel(props) {
  const [, drop] = useDrop({
    accept: ItemTypes.TASK,
    drop: item => {
      props.addTask(props.title, item.name);
    },
  });
  const children = props.tasks.map(task => <Task taskname={task} removeTask={(taskname) => props.removeTask(props.title, taskname)} />);
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
    item: { type: ItemTypes.TASK, name: props.taskname },
    end: (item, monitor) => {
      if (monitor.didDrop()) {
        props.removeTask(item.name);
      }
    }
  });
  const [, drop] = useDrop({
    accept: ItemTypes.TASK,
    /*hover: (item, monitor) => {
      if (item.name === props.taskname) {
        return;
      }
      if (item.type === ItemTypes.TASK) {
        this.props.addHover(props.taskname);
      }
    }*/
  });
  const combinedRef = ref => {
    drag(ref);
    drop(ref);
  };
  return (
    <div
      ref={combinedRef}
      style={{
        backgroundColor: 'yellow',
        margin: '5px',
        padding: '20px',
        height: '10px',
        border: props.taskname === 'placeholder' ? 'dashed black 0.2px': 'solid black 0.1px'
      }}
      className="task"
    >
      {props.taskname}
    </div>
  );
}

function Kanban(props) {
  const { boards } = props;
  const panels = boards.map(({ name, tasks = [] }) => {
    return <ConnectedPanel title={name} tasks={tasks} />;
  });
  return (
    <DndProvider backend={Html5Backend}>
      <div className="App">{panels}</div>
    </DndProvider>
  );
}

const mapStateToProps = (state) => {
  return {
    boards: state.boards
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    addTask: (boardname, taskname) => dispatch(createAddTask(boardname, taskname)),
    removeTask: (boardname, taskname) => dispatch(createRemoveTask(boardname, taskname))
  };
}

const ConnectedPanel = connect(null, mapDispatchToProps)(Panel);
const ConnectedKanban = connect(mapStateToProps)(Kanban);
const store = createStore(rootReducer, initState);

function render() {
  const rootElement = document.getElementById("root");
  ReactDOM.render(
    <Provider store={store}><ConnectedKanban /></Provider>,
    rootElement
  );
}

render();
