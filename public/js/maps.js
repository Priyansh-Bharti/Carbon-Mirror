'use strict';

/**
 * @fileoverview Google Maps API wrapper for commute distance calculation.
 */

/* global google */

import { logger } from './utils.js';

let googleMapsPromise = null;

/**
 * Dynamically loads the Google Maps JavaScript API.
 * @param {string} apiKey - The Google Maps API Key.
 * @returns {Promise<void>} Resolves when the script is loaded.
 */
export function loadGoogleMaps(apiKey) {
  if (googleMapsPromise) {return googleMapsPromise;}

  googleMapsPromise = new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMapCallback`;
    script.async = true;
    script.defer = true;
    
    window.initMapCallback = () => resolve();
    script.onerror = (err) => reject(new Error(`Failed to load Google Maps: ${err.message}`));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

/**
 * Calculate distance between two address points using Google Distance Matrix.
 * @param {string} origin - Origin address.
 * @param {string} destination - Destination address.
 * @param {string} mode - Travel mode ('DRIVING', 'TRANSIT', 'BICYCLING', 'WALKING').
 * @returns {Promise<number>} Distance in kilometres.
 */
export async function calculateCommuteDistance(origin, destination, mode = 'DRIVING') {
  try {
    await googleMapsPromise;
    const service = new google.maps.DistanceMatrixService();
    
    return new Promise((resolve, reject) => {
      service.getDistanceMatrix({
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode[mode],
        unitSystem: google.maps.UnitSystem.IMPERIAL
      }, (response, status) => {
        if (status !== 'OK') {
          reject(new Error(`Distance Matrix query failed with status: ${status}`));
          return;
        }
        const distanceVal = response.rows[0].elements[0].distance.value;
        const miles = distanceVal * 0.000621371; // Convert meters to miles
        logger.info('Calculated travel distance successfully.', { miles });
        resolve(miles);
      });
    });
  } catch (error) {
    logger.error('Maps calculation exception.', { message: error.message });
    throw error;
  }
}
