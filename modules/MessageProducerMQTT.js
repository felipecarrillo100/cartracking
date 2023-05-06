'use strict';
const mqtt = require('mqtt')

class MessageProducerMQTT {
    constructor(options) {
        options = options ? options : {};
        // Always use / for MQTT
        options.topicSeparator = "/";  

        this.mqttClient = null;
        this.relayhost = options.relayhost;
        this.port = options.port;
        
        this.clientId = `mqtt_${Math.random().toString(16).slice(3)}`
        this.connectUrl = `mqtt://${this.relayhost}:${this.port}`

        this.username = options.username;
        this.password = options.password;
        this.topicSeparator = options.topicSeparator;

        this.init = this.init.bind(this);
        this.connect = this.connect.bind(this);
        this.stompFailureCallback = this.stompFailureCallback.bind(this);
        this.counter = 0;
        this.reconnectPeriod = 10000;
    }

    stompFailureCallback(error) {
        console.log('MQTT: ', error);
        console.log(`MQTT: Reconnecting in ${this.reconnectPeriod} seconds`);
    }

    connect(frame) {
        console.log("MQTT client connected.");        
        if (this.counter++ == 0) this.firstResolve(this.mqttClient);
    }

    init() {
        return new Promise((resolve) => {
            this.firstResolve = resolve;
            this.mqttClient = mqtt.connect(this.connectUrl, {
                clientId: this.clientId,
                clean: true,
                connectTimeout: 4000,
                username: this.username,
                password: this.password,
                reconnectPeriod: this.reconnectPeriod,
              });

              this.mqttClient.on("reconnect", () => {
                console.log("Reconnecting...");                
              });

              this.mqttClient.on('connect', () => {
                this.connect(true);
            });

            this.mqttClient.on('error', (e) => {
                this.stompFailureCallback(e)
            });
        })
    }

    createPath(path) {
        const brokerpath =
            this.topicSeparator == "." ?
                path.split('/').join('.').replace(".topic.", "/topic/") : path;
        return brokerpath.substr("/topic/".length);
    }

    sendMessage(path, messageToPublish) {
        if (this.mqttClient) {
            const correctedPath = this.createPath(path);            
            this.mqttClient.publish(correctedPath,JSON.stringify(messageToPublish));
        }
    };
}

module.exports = MessageProducerMQTT;
