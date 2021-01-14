const { BasicGeodesy, Coordinate } = require("./BasicGeodesy");

const fs = require('fs');

const EARTH_RADIUS = 6371100.0;
const ARC_DEGREE_TO_METER = EARTH_RADIUS / (2.0 * Math.PI);

class TracksFromTrajectories {
   constructor(filename, options) {
       options = options ? options : {};
       this.idProperty = options.idProperty ? options.idProperty : null;
       this.filePath = filename;
       this.loadFile();
   }

   loadFile() {
       fs.readFile(this.filePath, {encoding: 'utf-8'}, (err,data) => {
           if (!err) {
               this.json = JSON.parse(data);
           } else {
               console.log(err);
           }
       });
   }

   interpolateAllTracks(t, sendFunction) {
       const features = this.json.features;
       for (let r =0; r<features.length;++r) {
           const feature = features[r];
           const properties  = feature.properties;
           const trackIdentifier = this.idProperty ? properties[this.idProperty] : feature.id;

           const pointAndHeading = this.calculatePointAndHeading(feature, t);

           const newProperties = {};
           Object.keys(properties).map(function(key, index) {
               if (key!=="timestamps") newProperties[key] = properties[key];
           });
           newProperties.heading = pointAndHeading.angle;

           const trackMessage = {
               "action": "PUT",
               "geometry": pointAndHeading.point,
               id: trackIdentifier,
               properties: newProperties
           }
           sendFunction(trackMessage);
       }
   }

    calculatePointAndHeading(feature, t) {
        const properties = feature.properties;

        const geometry = feature.geometry;
        const coordinates = geometry.coordinates;
        const timestamps = properties.timestamps;
        const maxTime = timestamps[timestamps.length-1];
        const localizedTime = t % maxTime;
        const index = TracksFromTrajectories.searchIndex(localizedTime, timestamps);

        const leftIndex = index;
        const  rightIndex = (index + 1) % timestamps.length;
        const leftTimeStamp = timestamps[leftIndex];
        let rightTimeStamp = timestamps[rightIndex];
        if (rightIndex < leftIndex) {
            rightTimeStamp += timestamps[timestamps.length-1];
        }
        const fraction = 1.0 *  (localizedTime - leftTimeStamp) / (rightTimeStamp-leftTimeStamp);

        const coordinateA = new Coordinate(coordinates[leftIndex]);
        const coordinateB = new Coordinate(coordinates[rightIndex]);
        const coordinate = BasicGeodesy.PointInLineGreatCircle(coordinateA, coordinateB, fraction);
        const angle = BasicGeodesy.forwardAzimuth2D(coordinateA, coordinateB);
        const point = {
            type: "Point",
            coordinates: coordinate.getAsArray()
        }
        return { point:point, angle:angle };
    }

     static  searchIndex( value,  a) {
        if(value < a[0]) {
            return 0;
        }
        if(value > a[a.length-1]) {
            return a.size()-1;
        }

        let lo = 0;
        let hi = a.length - 1;

        while (lo <= hi) {
            const mid = Math.floor((hi + lo) / 2);
            if (value < a[mid]) {
                hi = mid - 1;
            } else if (value > a[mid]) {
                lo = mid + 1;
            } else {
                return mid;
            }
        }
        return hi;
    }

}

module.exports = TracksFromTrajectories;
