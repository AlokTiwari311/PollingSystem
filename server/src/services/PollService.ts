import { PollModel, VoteModel } from '../models/Poll';

let activePoll: any = null;

const updateActivePollInMemory = (poll: any, votes: any = {}) => {
    activePoll = {
        id: poll._id.toString(),
        question: poll.question,
        options: poll.options,
        timerDuration: poll.timerDuration,
        startTime: poll.startTime,
        isActive: poll.isActive,
        status: poll.status,
        votes: votes
    };
    return activePoll;
};

export const loadActivePoll = async () => {
    try {
        const poll = await PollModel.findOne({ isActive: true });
        if (!poll) return;

        const now = Date.now();
        const elapsedSeconds = Math.floor((now - poll.startTime) / 1000);

        if (elapsedSeconds > poll.timerDuration) {
            poll.isActive = false;
            await poll.save();
            activePoll = null;
            return;
        }

        const votesList = await VoteModel.find({ pollId: poll._id });
        const votesMap: { [key: number]: number } = {};

        votesList.forEach((v: any) => {
            const result = votesMap[v.optionIndex] || 0;
            votesMap[v.optionIndex] = result + 1;
        });

        updateActivePollInMemory(poll, votesMap);

    } catch (e) {
        console.error("Poll load error", e);
    }
};

export const createPoll = async (question: string, options: string[], duration: number) => {
    if (activePoll) {
        await stopPoll();
    }

    const newPoll = new PollModel({
        question,
        options,
        timerDuration: duration,
        startTime: Date.now(),
        isActive: true,
        status: 'active',
        votes: {}
    });

    await newPoll.save();
    return updateActivePollInMemory(newPoll);
};

export const stopPoll = async () => {
    if (activePoll) {
        await PollModel.updateOne({ _id: activePoll.id }, { isActive: false, status: 'completed' });
        activePoll = null;
    }
};

export const getActivePoll = () => {
    return activePoll;
};

export const addVote = async (pollId: string, studentName: string, optionIndex: number) => {
    if (!activePoll || activePoll.id !== pollId) {
        throw "No active poll or invalid ID.";
    }

    const elapsed = Math.floor((Date.now() - activePoll.startTime) / 1000);
    if (elapsed > activePoll.timerDuration) {
        throw "Time over!";
    }

    try {
        await VoteModel.create({
            pollId,
            studentName,
            optionIndex
        });

        const currentVotes = activePoll.votes[optionIndex] || 0;
        activePoll.votes[optionIndex] = currentVotes + 1;

        return true;
    } catch (err: any) {
        if (err.code === 11000) {
            throw "You can only vote once!";
        }
        throw err;
    }
};

export const getPollResults = async (pollId: string) => {
    if (activePoll && activePoll.id === pollId.toString()) {
        return activePoll.votes;
    }

    const votesList = await VoteModel.find({ pollId });
    const votesMap: { [key: number]: number } = {};
    votesList.forEach((v: any) => {
        votesMap[v.optionIndex] = (votesMap[v.optionIndex] || 0) + 1;
    });
    return votesMap;
};

import * as fs from 'fs';

export const checkStudentVote = async (pollId: string, studentName: string) => {
    try { fs.appendFileSync('debug_log.txt', `[${new Date().toISOString()}] Checking vote for: Poll=${pollId}, Student=${studentName}\n`); } catch (e) { }

    const vote = await VoteModel.findOne({ pollId, studentName });

    try { fs.appendFileSync('debug_log.txt', `[${new Date().toISOString()}] Vote Found: ${JSON.stringify(vote)}\n`); } catch (e) { }

    if (vote) {
        return { hasVoted: true, optionIndex: vote.optionIndex };
    }
    return { hasVoted: false, optionIndex: null };
};

export const getAllPolls = async () => {
    const polls = await PollModel.find().sort({ startTime: -1 });

    const historyData = await Promise.all(polls.map(async (p) => {
        const votes = await getPollResults(p._id.toString());
        return {
            ...p.toObject(),
            votes
        };
    }));

    return historyData;
};
