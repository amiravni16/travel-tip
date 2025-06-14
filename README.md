# TravelTip

A web application for managing and sharing your favorite locations.

## Features

- **Location Management**
  - Add locations by clicking on the map
  - Update location details (name and rating)
  - Delete locations with confirmation
  - View location details including address and distance from current position

- **Map Integration**
  - Interactive Google Maps integration
  - Pan to selected locations
  - Search for addresses
  - Get user's current location

- **Filtering and Sorting**
  - Filter locations by name or address
  - Filter by minimum rating
  - Sort by name, rating, or creation time
  - Group locations by update time (today, past, never)

- **Statistics**
  - View location statistics by rating
  - View location statistics by last update time

- **Sharing**
  - Copy location URL to clipboard
  - Share locations using Web Share API

## Setup

1. Clone the repository
2. Add your Google Maps API key in the appropriate configuration
3. Open index.html in your browser

## Technologies

- Vanilla JavaScript
- HTML5 (including Dialog element for modals)
- CSS3 (with modern Material Design color theme)
- Google Maps JavaScript API
- Google Geocoding API

## Recent Updates

- Added confirmation before location removal
- Added sorting by creation time
- Enhanced location filtering to include address search
- Added distance calculation when user position is known
- Added grouping by last update time
- Replaced prompts with modern dialog modals
- Updated color theme to Material Design palette

## Description
TravelTip is an app that keeps a list of favorite locations

## Main Features
- The app allows the user to keep and manage locations
- The user can also search for an address and pan the map to that point
- The User can pan the map to his own geo-location

## Locations CRUDL 
- Create – click on the map to open a dialog for name and rate
- Read – Selected location details (see below) 
- Update – can update location rate using a dialog
- Delete – can delete a location with confirmation
- List - Including filtering, sorting and grouping

## Selected Location
- Displayed in the header
- Location is active in the list (gold color)
- Marker on the map
- Reflected in query params (bookmarkable, shareable URL)
- Copy URL to clipboard
- Share via Web-Share API
- Shows distance from user's position when available

## Location
Here is the format of the location object:
```js
{
    id: 'GEouN',
    name: 'Dahab, Egypt',
    rate: 5,
    geo: {
      address: 'Dahab, South Sinai, Egypt',
      lat: 28.5096676,
      lng: 34.5165187,
      zoom: 11
    },
    createdAt: 1706562160181,
    updatedAt: 1706562160181
}
```

## Services
```js
export const locService = {
    query,
    getById,
    remove,
    save,
    setFilterBy,
    setSortBy,
    getLocCountByRateMap,
    getLocCountByUpdateMap
}

export const mapService = {
    initMap,
    getPosition,
    setMarker,
    panTo,
    lookupAddressGeo,
    addClickListener
}
```

## Controller
```js
// To make things easier in this project structure 
// functions that are called from DOM are defined on a global app object

window.app = {
    onRemoveLoc,
    onUpdateLoc,
    onSelectLoc,
    onPanToUserPos,
    onSearchAddress,
    onCopyLoc,
    onShareLoc,
    onSetSortBy,
    onSetFilterBy
}
```

Here is a sample usage:
```html
<button onclick="app.onCopyLoc()">Copy location</button>
<button onclick="app.onShareLoc()">Share location</button>
```


