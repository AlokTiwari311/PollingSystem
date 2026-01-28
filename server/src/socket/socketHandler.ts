import { Server, Socket } from 'socket.io';
import { createPoll, addVote, getActivePoll, getPollResults, loadActivePoll, stopPoll, getQueue, activatePoll } from '../services/PollService';

const connectedStudents = new Map<string, string>();

export const handleSocketConnection = (io: Server, socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);



    // Send current state to newly connected client
    const active = getActivePoll();
    if (active) {
        socket.emit('poll_update', active);
    }

    // Send current participants
    socket.emit('participants_update', Array.from(connectedStudents.values()));

    socket.on('join_session', (name: string) => {
        connectedStudents.set(socket.id, name);
        console.log(`Student joined: ${name} (${socket.id})`);
        io.emit('participants_update', Array.from(connectedStudents.values()));
    });

    socket.on('create_poll', async (data: { question: string, options: string[], duration: number }) => {
        console.log("Creating poll", data);
        const newPoll = await createPoll(data.question, data.options, data.duration, 'active');
        io.emit('poll_created', newPoll); // Broadcast to all
    });

    // Queue Management
    socket.on('add_to_queue', async (data: { question: string, options: string[], duration: number }) => {
        console.log("Adding to queue", data);
        await createPoll(data.question, data.options, data.duration, 'queued');
        const queue = await getQueue();
        io.emit('queue_update', queue);
    });

    socket.on('get_queue', async () => {
        const queue = await getQueue();
        socket.emit('queue_update', queue);
    });

    socket.on('launch_queued_poll', async (pollId: string) => {
        try {
            const poll = await activatePoll(pollId);
            io.emit('poll_created', poll); // Start the poll for everyone

            // Update queue list
            const queue = await getQueue();
            io.emit('queue_update', queue);
        } catch (e) {
            console.error("Failed to launch queued poll", e);
        }
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
        io.emit('poll_update', null); // clear for everyone
    });

    socket.on('disconnect', () => {
        if (connectedStudents.has(socket.id)) {
            const name = connectedStudents.get(socket.id);
            connectedStudents.delete(socket.id);
            io.emit('participants_update', Array.from(connectedStudents.values()));
            console.log(`Student disconnected: ${name}`);
        }
        console.log(`Client disconnected: ${socket.id}`);
    });
};

loadActivePoll().then(() => {
    console.log("State loaded from DB");
});
