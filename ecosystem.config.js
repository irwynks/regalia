module.exports = {
    apps: [{
        name: "regalia:api",
        cwd: "./api",
        script: "./main.js"
    },
    {
        name: "regalia:engine",
        cwd: "./engine",
        script: "./main.js"
    },
    {
        name: "regalia:portal",
        cwd: "./app",
        script: "npm",
        args: 'start'
    }
    ]
}