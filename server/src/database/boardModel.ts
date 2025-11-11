import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const TaskSchema = new Schema({
  id: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: false },
  createdDate: { type: Date, required: false},
  modifiedDate: { type: Date, required: false},
});

const boardSchema = new Schema({

    taskList : {
        type: Map,
        of: TaskSchema,
        default: {},
    },
    columns : {
        type: Map,
        of: [Number],
        default: {
            "todo" : [],
            "ongoing" : [],
            "completed" : []
        }
    },
    order : {
        type: [String],
        default:  ["todo", "ongoing", "completed"]
    },

})

export const Board = mongoose.model("Board", boardSchema);