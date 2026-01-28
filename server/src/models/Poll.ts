import mongoose from 'mongoose';

const PollSchema = new mongoose.Schema({
    question: String,
    options: [String],
    timerDuration: Number,
    startTime: Number,
    isActive: Boolean,
    status: {
        type: String,
        enum: ['queued', 'active', 'completed'],
        default: 'queued'
    },
    votes: {
        type: Map,
        of: Number,
        default: {}
    }
});

export const PollModel = mongoose.model('Poll', PollSchema);

const VoteSchema = new mongoose.Schema({
    pollId: String,
    studentName: String,
    optionIndex: Number
});
VoteSchema.index({ pollId: 1, studentName: 1 }, { unique: true });

export const VoteModel = mongoose.model('Vote', VoteSchema);
