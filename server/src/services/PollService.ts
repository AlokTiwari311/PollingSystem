import { PollModel, VoteModel } from '../models/Poll';

let activePoll: any = null; // In-memory cache for active poll

// Load active poll from DB on server restart (Resilience)
export const loadActivePoll = async () => {
    try {
        const poll = await PollModel.findOne({ isActive: true });
        if (poll) {
            // Check if it's expired based on duration
            const now = Date.now();
            const elapsed = Math.floor((now - poll.startTime) / 1000);

            if (elapsed > poll.timerDuration) {
                console.log("Found stale active poll on startup. Marking as inactive.");
                poll.isActive = false;
                await poll.save();
                activePoll = null;
                return;
            }

            // Re-construct aggregate votes
            const votesList = await VoteModel.find({ pollId: poll._id });
            const votesMap: { [key: number]: number } = {};
            votesList.forEach((v: any) => {
                votesMap[v.optionIndex] = (votesMap[v.optionIndex] || 0) + 1;
            });

            activePoll = {
                id: poll._id.toString(),
                question: poll.question,
                options: poll.options,
                timerDuration: poll.timerDuration,
                startTime: poll.startTime,
                isActive: poll.isActive,
                votes: votesMap
            };
            console.log("Active poll loaded from MongoDB");
        }
    } catch (e) {
        console.error("Failed to load active poll", e);
    }
};

export const createPoll = async (question: string, options: string[], duration: number, status: 'active' | 'queued' = 'active') => {
    // If activating immediately, stop others
    if (status === 'active' && activePoll) {
        console.log("Stopping previous active poll to start new one.");
        activePoll.isActive = false;
        await PollModel.updateOne({ _id: activePoll.id }, { isActive: false, status: 'completed' });
    }

    const startTime = Date.now();
    const newPoll = new PollModel({
        question,
        options,
        timerDuration: duration,
        startTime,
        isActive: status === 'active', // sync legacy field
        status,
        votes: {}
    });

    await newPoll.save();

    // Only set as active in-memory if it's actually active
    if (status === 'active') {
        activePoll = {
            id: newPoll._id.toString(),
            question,
            options,
            timerDuration: duration,
            startTime,
            isActive: true,
            status: 'active',
            votes: {}
        };
        return activePoll;
    }

    return newPoll;
};

export const getQueue = async () => {
    return await PollModel.find({ status: 'queued' }).sort({ _id: 1 }); // FIFO
};


// Stop the active poll (Zombie Poll Fix)
export const stopPoll = async () => {
    if (activePoll) {
        console.log(`Stopping poll ${activePoll.id}`);
        // Update DB
        await PollModel.updateOne({ _id: activePoll.id }, { isActive: false, status: 'completed' });
        // Update Memory
        activePoll.isActive = false;
        activePoll = null;
    }
};

export const activatePoll = async (pollId: string) => {
    // Stop current
    await stopPoll();

    const poll = await PollModel.findById(pollId);
    if (!poll) throw "Poll not found";

    poll.status = 'active';
    poll.isActive = true;
    poll.startTime = Date.now();
    await poll.save();

    activePoll = {
        id: poll._id.toString(),
        question: poll.question,
        options: poll.options,
        timerDuration: poll.timerDuration,
        startTime: poll.startTime,
        isActive: true,
        status: 'active',
        votes: {}
    };
    return activePoll;
};

export const getActivePoll = () => {
    return activePoll;
};

export const addVote = async (pollId: string, studentName: string, optionIndex: number) => {
    if (!activePoll || activePoll.id !== pollId) {
        throw "No active poll or poll mismatch";
    }

    // Check time
    const elapsed = Math.floor((Date.now() - (activePoll.startTime || 0)) / 1000);
    if (elapsed > activePoll.timerDuration) {
        throw "Time is up";
    }

    try {
        await VoteModel.create({
            pollId,
            studentName,
            optionIndex
        });

        // Update in-memory
        activePoll.votes[optionIndex] = (activePoll.votes[optionIndex] || 0) + 1;

        // Update Poll Document votes map as well for redundancy/history? Optional but good.
        // await PollModel.updateOne({ _id: pollId }, { $inc: { [`votes.${optionIndex}`]: 1 } });

        return true;
    } catch (err: any) {
        if (err.code === 11000) { // Duplicate key error
            throw "Already voted";
        }
        throw err;
    }
};

// Result aggregation
export const getPollResults = async (pollId: string) => {
    // return activePoll votes if match
    if (activePoll && activePoll.id === pollId.toString()) {
        return activePoll.votes;
    }

    // If not active, fetch from History
    const votesList = await VoteModel.find({ pollId });
    const votesMap: { [key: number]: number } = {};
    votesList.forEach((v: any) => {
        votesMap[v.optionIndex] = (votesMap[v.optionIndex] || 0) + 1;
    });
    return votesMap;
};



export const getAllPolls = async () => {
    const polls = await PollModel.find({ status: { $ne: 'queued' } }).sort({ startTime: -1 });

    // Enrich with votes
    const historyData = await Promise.all(polls.map(async (p) => {
        const votesList = await VoteModel.find({ pollId: p._id.toString() });
        const votesMap: { [key: number]: number } = {};
        votesList.forEach((v: any) => {
            votesMap[v.optionIndex] = (votesMap[v.optionIndex] || 0) + 1;
        });

        return {
            ...p.toObject(),
            votes: votesMap
        };
    }));

    return historyData;
};
