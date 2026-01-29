import { Server, Socket } from 'socket.io';
import { createPoll, addVote, getActivePoll, getPollResults, loadActivePoll, stopPoll, checkStudentVote } from '../services/PollService';

const connectedStudents = new Map<string, string>();

export const handleSocketConnection = (io: Server, socket: Socket) => {
    console.log(`New connection: ${socket.id}`);

    const active = getActivePoll();
    if (active) {
        socket.emit('poll_update', active);
    }

    socket.emit('participants_update', Array.from(connectedStudents.values()));

    socket.on('join_session', async (name: string) => {
        connectedStudents.set(socket.id, name);
        io.emit('participants_update', Array.from(connectedStudents.values()));

        const currentPoll = getActivePoll();
        if (currentPoll) {
            const voteStatus = await checkStudentVote(currentPoll.id, name);
            if (voteStatus.hasVoted) {
                socket.emit('student_vote_status', voteStatus);
            }
        }
    });

    socket.on('check_my_vote', async (data: { pollId: string, studentName: string }) => {
        const voteStatus = await checkStudentVote(data.pollId, data.studentName);
        if (voteStatus.hasVoted) {
            socket.emit('student_vote_status', voteStatus);
        }
    });

    socket.on('create_poll', async (data: { question: string, options: string[], duration: number }) => {
        const newPoll = await createPoll(data.question, data.options, data.duration);
        io.emit('poll_created', newPoll);
    });

    socket.on('vote', async (data: { pollId: string, studentName: string, optionIndex: number }) => {
        try {
            await addVote(data.pollId, data.studentName, data.optionIndex);
            const results = await getPollResults(data.pollId);
            io.emit('poll_results_update', results);
        } catch (err: any) {
            socket.emit('error_message', err);
        }
    });

    socket.on('request_results', async (pollId: string) => {
        const results = await getPollResults(pollId);
        socket.emit('poll_results_update', results);
    });

    socket.on('chat_message', (data: { sender: string, text: string }) => {
        io.emit('chat_message', data);
    });

    socket.on('kick_student', (studentName: string) => {
        for (const [id, name] of connectedStudents.entries()) {
            if (name === studentName) {
                connectedStudents.delete(id);
            }
        }

        io.emit('kick_student', studentName);
        io.emit('participants_update', Array.from(connectedStudents.values()));
    });

    socket.on('stop_poll', async () => {
        await stopPoll();
        io.emit('poll_update', null);
    });

    socket.on('disconnect', () => {
        if (connectedStudents.has(socket.id)) {
            connectedStudents.delete(socket.id);
            io.emit('participants_update', Array.from(connectedStudents.values()));
        }
    });
};

loadActivePoll().then(() => {
    console.log("State loaded from DB.");
});
