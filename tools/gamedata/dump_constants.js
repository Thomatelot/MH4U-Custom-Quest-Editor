// Writes constants.json (the tables of the editor: monster names, objectives...) for build_data.py.
// usage: node dump_constants.js <work folder>
var path = require('path'), fs = require('fs');
var load = require(path.join(__dirname, '..', '..', 'tests', 'load_angular_module.js'));
var c = load(path.join(__dirname, '..', '..', 'source', 'app', 'utils', 'constants.js')).constants();
var work = process.argv[2] || '.';
fs.writeFileSync(path.join(work, 'constants.json'), JSON.stringify(c));
console.log('written', path.join(work, 'constants.json'));
