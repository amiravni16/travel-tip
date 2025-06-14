import { utilService } from './services/util.service.js'
import { locService } from './services/loc.service.js'
import { mapService } from './services/map.service.js'

window.onload = onInit
var gUserPos = null
var gTempGeo = null

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
    onSetFilterBy,
}

function onInit() {
    getFilterByFromQueryParams()
    loadAndRenderLocs()
    mapService.initMap()
        .then(() => {
            mapService.addClickListener(onAddLoc)
        })
        .catch(() => {
            flashMsg('Cannot init map')
        })
}

function renderLocs(locs) {
    const selectedLocId = getLocIdFromQueryParams()

    var strHTML = locs.map(loc => {
        const className = (loc.id === selectedLocId) ? 'active' : ''
        const distance = gUserPos ? 
            `<span class="distance">Distance: ${utilService.getDistance(gUserPos, loc.geo, 'K')} KM.</span>` : ''
        return `
        <li class="loc ${className}" data-id="${loc.id}">
            <h4>  
                <span>${loc.name}</span>
                ${distance}
                <span title="${loc.rate} stars">${'★'.repeat(loc.rate)}</span>
            </h4>
            <p class="muted">
                Created: ${utilService.elapsedTime(loc.createdAt)}
                ${(loc.createdAt !== loc.updatedAt) ?
                ` | Updated: ${utilService.elapsedTime(loc.updatedAt)}`
                : ''}
            </p>
            <div class="loc-btns">     
               <button title="Delete" onclick="app.onRemoveLoc('${loc.id}')">🗑️</button>
               <button title="Edit" onclick="app.onUpdateLoc('${loc.id}')">✏️</button>
               <button title="Select" onclick="app.onSelectLoc('${loc.id}')">🗺️</button>
            </div>     
        </li>`}).join('')

    const elLocList = document.querySelector('.loc-list')
    elLocList.innerHTML = strHTML || 'No locs to show'

    renderLocStats()

    if (selectedLocId) {
        const selectedLoc = locs.find(loc => loc.id === selectedLocId)
        displayLoc(selectedLoc)
    }
}

function onRemoveLoc(locId) {
    if (!confirm('Are you sure you want to remove this location?')) return
    
    locService.remove(locId)
        .then(() => {
            flashMsg('Location removed')
            unDisplayLoc()
            loadAndRenderLocs()
        })
        .catch(() => {
            flashMsg('Cannot remove location')
        })
}

function onSearchAddress(ev) {
    ev.preventDefault()
    const el = document.querySelector('[name=address]')
    mapService.lookupAddressGeo(el.value)
        .then(geo => {
            mapService.panTo(geo)
        })
        .catch(() => {
            flashMsg('Cannot lookup address')
        })
}

function onAddLoc(geo) {
    gTempGeo = geo
    const dialog = document.querySelector('.location-dialog')
    const form = dialog.querySelector('form')
    
    // Set default values
    form.elements.name.value = geo.address || 'New Location'
    form.elements.rate.value = 3
    
    dialog.addEventListener('close', handleAddLocDialog)
    dialog.showModal()
}

function handleAddLocDialog(event) {
    const dialog = event.target
    const result = dialog.returnValue
    
    if (result === 'save') {
        const form = dialog.querySelector('form')
        const loc = {
            name: form.elements.name.value,
            rate: +form.elements.rate.value,
            geo: gTempGeo
        }
        
        locService.save(loc)
            .then((savedLoc) => {
                flashMsg(`Added Location (id: ${savedLoc.id})`)
                utilService.updateQueryParams({ locId: savedLoc.id })
                loadAndRenderLocs()
            })
            .catch(() => {
                flashMsg('Cannot add location')
            })
    }
    
    // Clean up
    dialog.removeEventListener('close', handleAddLocDialog)
    gTempGeo = null
}

function loadAndRenderLocs() {
    locService.query()
        .then(renderLocs)
        .catch(() => {
            flashMsg('Cannot load locations')
        })
}

function onPanToUserPos() {
    mapService.getUserPosition()
        .then(latLng => {
            gUserPos = latLng
            mapService.panTo({ ...latLng, zoom: 15 })
            unDisplayLoc()
            loadAndRenderLocs()
            flashMsg(`You are at Latitude: ${latLng.lat} Longitude: ${latLng.lng}`)
        })
        .catch(() => {
            flashMsg('Cannot get your position')
        })
}

function onUpdateLoc(locId) {
    locService.getById(locId)
        .then(loc => {
            const dialog = document.querySelector('.location-dialog')
            const form = dialog.querySelector('form')
            
            // Set current values
            form.elements.name.value = loc.name
            form.elements.rate.value = loc.rate
            
            // Store the loc for the handler
            dialog.dataset.locId = locId
            
            dialog.addEventListener('close', handleUpdateLocDialog)
            dialog.showModal()
        })
}

function handleUpdateLocDialog(event) {
    const dialog = event.target
    const result = dialog.returnValue
    
    if (result === 'save') {
        const form = dialog.querySelector('form')
        const locId = dialog.dataset.locId
        
        locService.getById(locId)
            .then(loc => {
                loc.name = form.elements.name.value
                loc.rate = +form.elements.rate.value
                
                return locService.save(loc)
            })
            .then(() => {
                flashMsg(`Location updated successfully`)
                loadAndRenderLocs()
            })
            .catch(() => {
                flashMsg('Cannot update location')
            })
    }
    
    // Clean up
    dialog.removeEventListener('close', handleUpdateLocDialog)
    delete dialog.dataset.locId
}

function onSelectLoc(locId) {
    return locService.getById(locId)
        .then(displayLoc)
        .catch(() => {
            flashMsg('Cannot display this location')
        })
}

function displayLoc(loc) {
    document.querySelector('.loc.active')?.classList?.remove('active')
    document.querySelector(`.loc[data-id="${loc.id}"]`).classList.add('active')

    mapService.panTo(loc.geo)
    mapService.setMarker(loc)

    const el = document.querySelector('.selected-loc')
    el.querySelector('.loc-name').innerText = loc.name
    el.querySelector('.loc-address').innerText = loc.geo.address
    el.querySelector('.loc-rate').innerHTML = '★'.repeat(loc.rate)
    
    if (gUserPos) {
        const distance = utilService.getDistance(gUserPos, loc.geo, 'K')
        el.querySelector('.loc-distance').innerHTML = `Distance: ${distance} KM.`
    } else {
        el.querySelector('.loc-distance').innerHTML = ''
    }
    
    el.querySelector('[name=loc-copier]').value = window.location
    el.classList.add('show')

    utilService.updateQueryParams({ locId: loc.id })
}

function unDisplayLoc() {
    utilService.updateQueryParams({ locId: '' })
    document.querySelector('.selected-loc').classList.remove('show')
    mapService.setMarker(null)
}

function onCopyLoc() {
    const elCopy = document.querySelector('[name=loc-copier]')
    elCopy.select()
    elCopy.setSelectionRange(0, 99999) // For mobile devices
    navigator.clipboard.writeText(elCopy.value)
    flashMsg('Link copied, ready to paste')
}

function onShareLoc() {
    if (!navigator.share) {
        flashMsg('Web Share API is not supported in your browser')
        return
    }

    const url = document.querySelector('[name=loc-copier]').value
    const selectedLoc = document.querySelector('.loc-name').innerText

    navigator.share({
        title: 'TravelTip Location',
        text: `Check out ${selectedLoc} on TravelTip!`,
        url: url
    })
    .then(() => flashMsg('Location shared successfully'))
    .catch(() => {
        flashMsg('Failed to share location')
    })
}

function flashMsg(msg) {
    const el = document.querySelector('.user-msg')
    el.innerText = msg
    el.classList.add('open')
    setTimeout(() => {
        el.classList.remove('open')
    }, 3000)
}

function getFilterByFromQueryParams() {
    const queryParams = new URLSearchParams(window.location.search)
    const txt = queryParams.get('txt') || ''
    const minRate = queryParams.get('minRate') || 0
    locService.setFilterBy({txt, minRate})

    document.querySelector('input[name="filter-by-txt"]').value = txt
    document.querySelector('input[name="filter-by-rate"]').value = minRate
}

function getLocIdFromQueryParams() {
    const queryParams = new URLSearchParams(window.location.search)
    const locId = queryParams.get('locId')
    return locId
}

function onSetSortBy() {
    const prop = document.querySelector('.sort-by').value
    const isDesc = document.querySelector('.sort-desc').checked

    if (!prop) return

    const sortBy = {}
    sortBy[prop] = (isDesc) ? -1 : 1

    // Shorter Syntax:
    // const sortBy = {
    //     [prop] : (isDesc)? -1 : 1
    // }

    locService.setSortBy(sortBy)
    loadAndRenderLocs()
}

function onSetFilterBy({ txt, minRate }) {
    const filterBy = locService.setFilterBy({ txt, minRate: +minRate })
    utilService.updateQueryParams(filterBy)
    loadAndRenderLocs()
}

function renderLocStats() {
    // Render rate stats
    locService.getLocCountByRateMap()
        .then(stats => {
            handleStats(stats, '.loc-stats-rate')
        })

    // Render update stats
    locService.getLocCountByUpdateMap()
        .then(stats => {
            handleStats(stats, '.loc-stats-update')
        })
}

function handleStats(stats, selector) {
    const elStats = document.querySelector(selector)
    const elPie = elStats.querySelector('.pie')
    const elLegend = elStats.querySelector('.legend')

    // Clean the stats object from the total property
    const cleanStats = _cleanStats(stats)
    const total = stats.total

    const colors = utilService.getColors()

    // Create the pie chart
    const pieData = Object.entries(cleanStats)
        .map(([key, value], idx) => ({
            value: (value / total) * 100,
            color: colors[idx % colors.length]
        }))

    let start = 0
    const pieSegments = pieData.map((data, idx) => {
        const end = start + data.value
        const segment = `${data.color} ${start}% ${end}%`
        start = end
        return segment
    })
    elPie.style.background = `conic-gradient(${pieSegments.join(',')})`

    // Create the legend
    const strHTMLs = Object.entries(cleanStats)
        .map(([key, value], idx) => `
            <li>
                <span class="color-mark" style="background-color: ${colors[idx % colors.length]}"></span>
                <span>${key}: ${value}</span>
            </li>
        `).join('')

    elLegend.innerHTML = strHTMLs
}

function _cleanStats(stats) {
    const cleanStats = { ...stats }
    delete cleanStats.total
    return cleanStats
}
