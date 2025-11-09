const serviceName = "cars";

const path = require('path');
const MessageProducer = require("./modules/MessageProducer");
const MessageProducerMQTT = require("./modules/MessageProducerMQTT");
const TracksFromTrajectories = require("./modules/TracksFromTrajectories");
const {setupGracefulShutdown} = require("./modules/GracefulShutdown");

class TracksEmitter {
    constructor(options) {
        this.targetBroker = options.broker;
        this.carTraks = new TracksFromTrajectories(path.join(__dirname, "resources/routes.json"), {idProperty: "identifier"});
    }

    connect() {
        this.targetBroker.init().then((producer)=>{
            if (producer == null) {
                console.log("Exit: Failed to authenticate");
                process.exit(1); // Docker will restart
            } else {
                console.error("Starting track generator");
                console.error("Control+C to stop");
                this.startTrackGenerator();
            }
        }, () =>{
            console.log("Exit: Failed to connect");
            process.exit(1); // Docker will restart
        });
    }

    onSuccessfulWebSocketConnect(broker) {
       // Restore subscriptions on an new Session (every time the cookie expires)
       broker.subscribe('/topic/echochannel', (stompMessage) => {
            const body = JSON.parse(stompMessage.body);
            console.log("echo :" + JSON.stringify(body));
        });
    }

    startTrackGenerator() {
        this.timer = null;
        this.clearAll();
        this.nextTrack();
    }

    stopTrackGenerator() {
        console.log("Stopped emitting tracks!")
        clearTimeout(this.timer);
        this.timer = null;
    }

    nextTrack() {
        this.timer = setTimeout(() => {
            // update
            this.generateTracks(Date.now());

            this.nextTrack()
        }, 1000)
    }

    generateTracks(time) {
        const sendTrackDataMessage = (trackMessage) => {
            const company = trackMessage.properties.company;
            const path1 = "/topic/producers/" + serviceName +"/data/" + company + "/" + trackMessage.id;
            this.targetBroker.sendMessage(path1, trackMessage);
        }
        const t = Math.floor(time / 1000);
        this.carTraks.interpolateAllTracks(t, sendTrackDataMessage)
    }

    clearAll() {
        const command = {
            "action": "CLEAR",
            "context": "CLEAR"
        }
        const path = "/topic/producers/" + serviceName +"/control/"
        this.targetBroker.sendMessage(path, command);
    }
}

// Samples were tested using our broker at: leu-gsp-vrndp06.ingrnet.com
function createMqttBroker() {
    return new MessageProducerMQTT({
        relayhost: process.env.MQTT_HOST || "localhost", //  URL of your Broker (ActiveMQ, RabbitMQ or any other MQTT compliant Broker)
        port: process.env.MQTT_PORT || "1883", //  Port of your Broker, in most cases 1883 for http and 8883 for SSL
        username: process.env.MQTT_USER || "admin",  //  A valid user defined in your Broker capable to send messages  (see your Broker user guide to create the user)
        password: process.env.MQTT_PASS || "admin", // Passsword for the user
    });
}

function createStompBroker() {
    return new MessageProducer({
        relayhost: process.env.STOMP_HOST || "localhost", //  URL of your Broker (ActiveMQ, RabbitMQ or any other STOMP compliant Broker)
        port: process.env.STOMP_PORT || "61613",  //  Port of your Broker, in most cases 61613 for http and 61612 for SSL
        username: process.env.STOMP_USER || "admin",  //  A valid user defined in your Broker capable to send to /topic/  (see your Broker user guide to create the user)
        password: process.env.STOMP_PASS || "admin",  //  Passsword for the user
        topicSeparator: process.env.STOMP_TOPIC_SEPARATOR || ".",  // Some brokers use "/" by default, however it could be that your Broker is configured to use "." for STOMP protocol
    });
}

const protocol = (process.argv[2] || process.env.PROTOCOL || "stomp").toLowerCase();

const broker = protocol === "mqtt" ? createMqttBroker() : createStompBroker();

const trackEmitter = new TracksEmitter({
    broker,
});

// Set clean shut down on Control+C
setupGracefulShutdown(trackEmitter, broker);

//  Start the transmission
trackEmitter.connect();


