
const testResults = document.getElementById('test-results');
let currentSuite;

function describe(name, fn) {
    currentSuite = document.createElement('div');
    currentSuite.innerHTML = `<h2 class="text-xl font-bold">${name}</h2>`;
    testResults.appendChild(currentSuite);
    fn();
}

function it(name, fn) {
    const testCase = document.createElement('div');
    testCase.classList.add('flex', 'items-center', 'gap-2');
    try {
        fn();
        testCase.innerHTML = `<span class="text-green-500">✅</span> <span>${name}</span>`;
    } catch (e) {
        testCase.innerHTML = `<span class="text-red-500">❌</span> <span>${name}</span><pre class="bg-red-100 text-red-700 p-2 rounded">${e.stack}</pre>`;
    }
    currentSuite.appendChild(testCase);
}

function expect(actual) {
    return {
        toBe(expected) {
            if (actual !== expected) {
                throw new Error(`Expected ${actual} to be ${expected}`);
            }
        },
        toEqual(expected) {
            if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
            }
        },
        toBeTruthy() {
            if (!actual) {
                throw new Error(`Expected ${actual} to be truthy`);
            }
        },
        toBeFalsy() {
            if (actual) {
                throw new Error(`Expected ${actual} to be falsy`);
            }
        },
    };
}
