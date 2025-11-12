import { IBoard } from "./interface/board";
import { ITask } from "./interface/task";
import mongoose from "mongoose";

const { Schema } = mongoose;

const TaskSchema = new Schema<ITask>({

  id: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String },
  createdDate: { type: Date },
  modifiedDate: { type: Date },

});

const boardSchema = new Schema<IBoard>({

  taskList: {
    type: Map,
    of: TaskSchema,
    default: {},
  },

  columns: {
    type: Map,
    of: [Number],
    default: {
      todo: [],
      ongoing: [],
      completed: [],
    },
  },

  order: {
    type: [String],
    default: ["todo", "ongoing", "completed"],
  },
  
});

export const Board = mongoose.model<IBoard>("Board", boardSchema);