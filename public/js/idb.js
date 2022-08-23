let db;
const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function (event) {
    const db = event.target.result;
    db.createObjectStore('new_data', { autoIncrement: true });
};

request.onsuccess = function (event) {
    // save reference to db in global variable 
    db = event.target.result;

    // check to see if app's online then send db data to api
    if (navigator.onLine) {
        uploadData();
    }
};

request.onerror = function (event) {
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    // new transaction for database with read and write permissions
    const transaction = db.transaction(['new_data'], 'readwrite');

    // accesses the object store for new data 
    const dataObjectStore = transaction.objectStore('new_data');

    // add a record to the object store
    dataObjectStore.add(record);
}

function uploadData() {
    // opens a transaction to the db
    const transaction = db.transaction(['new_data'], 'readwrite');

    // accesses object store
    const dataObjectStore = transaction.objectStore('new_data');

    // get all records from store and sets them to a varaible 
    const getAll = dataObjectStore.getAll();

    // function only runs if getAll() was successful
    getAll.onsuccess = function () {
        // sends any data from idb store to api server if any
        if (getAll.result.length > 0) {
            fetch('/routes/api/', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    // opens another transaction
                    const transaction = db.transaction(['new_data'], 'readwrite');
                    // accesses the new data object store 
                    const dataObjectStore = transaction.objectStore('new_data');
                    // removes all records from store
                    dataObjectStore.clear();

                    alert('All saved data has been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
}

// listen for app coming back online
window.addEventListener('online', uploadData);