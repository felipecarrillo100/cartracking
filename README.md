## Description
This is a small example to illustrate how tracks can be generated and send to a STOPM broker.
This samples sends updates of cars moving around New York (Manhatan and Airports).

## How to install:
Intall all the project dependencies with npm
```
npm install
```

## To use
### Start the application development mode
```
npm start
```
The application will start emiting tracks at: 
/topic/producers/cars/

The topics can be refined to restrict the company or id 

### Start the application for production
For production we strongly advise using pm2 to supervise and keep the application running in the background
```
pm2 start index.js --name cartracking --exp-backoff-restart-delay=100
```
