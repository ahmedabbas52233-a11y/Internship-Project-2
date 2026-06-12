// src/config/db-memory.js
// In-memory database fallback when MongoDB is unavailable

const { v4: uuidv4 } = require('uuid');

class InMemoryDB {
    constructor() {
        this.users = [];
        this.posts = [];
        this.contacts = [];
        this.sessions = new Map(); // token -> userId
    }

    // Users
    createUser(data) {
        const user = {
            _id: uuidv4(),
            name: data.name,
            email: data.email,
            password: data.password, // pre-hashed
            role: data.role || 'user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.users.push(user);
        return { ...user };
    }

    findUserByEmail(email) {
        return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    }

    findUserById(id) {
        return this.users.find(u => u._id === id);
    }

    getAllUsers() {
        return this.users.map(u => ({ ...u, password: undefined }));
    }

    // Posts
    createPost(data) {
        const post = {
            _id: uuidv4(),
            title: data.title,
            content: data.content,
            author: data.author || 'Anonymous',
            tags: data.tags || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.posts.push(post);
        return post;
    }

    getAllPosts() {
        return [...this.posts];
    }

    // Contacts
    createContact(data) {
        const contact = {
            _id: uuidv4(),
            name: data.name,
            email: data.email,
            message: data.message,
            subject: data.subject || 'General',
            createdAt: new Date().toISOString()
        };
        this.contacts.push(contact);
        return contact;
    }

    getAllContacts() {
        return [...this.contacts];
    }

    // Stats
    getStats() {
        return {
            users: this.users.length,
            posts: this.posts.length,
            contacts: this.contacts.length
        };
    }

    // Seed sample data
    seed() {
        if (this.users.length === 0) {
            this.createUser({
                name: 'Ahmed Abbas',
                email: 'ahmed@example.com',
                password: '$2b$10$hashedpasswordplaceholder',
                role: 'admin'
            });
            this.createUser({
                name: 'Demo User',
                email: 'demo@example.com',
                password: '$2b$10$hashedpasswordplaceholder',
                role: 'user'
            });
        }
        if (this.posts.length === 0) {
            this.createPost({
                title: 'Welcome to DecodeLabs',
                content: 'This is a demo post showing the in-memory database functionality.',
                author: 'Ahmed Abbas',
                tags: ['demo', 'internship']
            });
            this.createPost({
                title: 'API Architecture',
                content: 'RESTful API built with Node.js, Express, and in-memory storage.',
                author: 'System',
                tags: ['api', 'architecture']
            });
        }
    }
}

const memoryDB = new InMemoryDB();
memoryDB.seed();

console.log('✅ In-memory database initialized with sample data');
console.log(`   Users: ${memoryDB.getStats().users}, Posts: ${memoryDB.getStats().posts}, Contacts: ${memoryDB.getStats().contacts}`);

module.exports = memoryDB;