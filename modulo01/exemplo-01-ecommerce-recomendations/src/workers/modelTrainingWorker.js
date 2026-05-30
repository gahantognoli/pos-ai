import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
import { workerEvents } from '../events/constants.js';

console.log('Model training worker initialized');
let _globalCtx = {};
let _model = null;
const WEIGTHS = {
    category: 0.4,
    color: 0.3,
    price: 0.2,
    age: 0.1
}

const normalize = (value, min, max) => (value - min) / ((max - min) || 1);

function makeContext(products, users) {
    const ages = users.map(u => u.age);
    const prices = products.map(p => p.price);

    const minAge = Math.min(...ages);
    const maxAge = Math.max(...ages);

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const colors = [...new Set(products.map(p => p.color))];
    const categories = [...new Set(products.map(p => p.category))];

    const colorsIndex = Object.fromEntries(colors.map((c, i) => [c, i]));
    const categoriesIndex = Object.fromEntries(categories.map((c, i) => [c, i]));

    // computar a média de idade dos usuários por produto
    const midAge = (minAge + maxAge) / 2;
    const ageSums = {};
    const ageCounts = {};

    users.forEach(user => {
        user.purchases.forEach((p) => {
            ageSums[p.name] = (ageSums[p.name] || 0) + user.age;
            ageCounts[p.name] = (ageCounts[p.name] || 0) + 1;
        });
    });

    const productAvgAgeNorm = Object.fromEntries(
        products.map(p => {
            const avg = ageSums[p.name] ? ageSums[p.name] / ageCounts[p.name] : midAge;
            return [p.name, normalize(avg, minAge, maxAge)];
        })
    )

    return {
        products,
        users,
        colorsIndex,
        categoriesIndex,
        minAge,
        maxAge,
        minPrice,
        maxPrice,
        numCategories: categories.length,
        numColors: colors.length,
        dimentions: 2 + categories.length + colors.length,
        productAvgAgeNorm
    }
}

const oneHotWeighted = (index, length, weight) => {
    return tf.oneHot(index, length).cast('float32').mul(weight);
}

function encodeProduct(product, ctx) {
    const price = tf.tensor1d([normalize(product.price, ctx.minPrice, ctx.maxPrice) * WEIGTHS.price]);
    const age = tf.tensor1d([ctx.productAvgAgeNorm[product.name] ?? 0.5 * WEIGTHS.age]);
    const category = oneHotWeighted(ctx.categoriesIndex[product.category], ctx.numCategories, WEIGTHS.category);
    const color = oneHotWeighted(ctx.colorsIndex[product.color], ctx.numColors, WEIGTHS.color);

    return tf.concat1d([price, age, category, color]);
}

function encodeUser(user, ctx) {
    if (user.purchases.length) {
        return tf.stack(user.purchases.map(p => encodeProduct(p, ctx)))
            .mean(0)
            .reshape([1, ctx.dimentions]);
    }

    return tf.concat1d([
        tf.zeros([1]),
        tf.tensor1d([normalize(user.age, ctx.minAge, ctx.maxAge) * WEIGTHS.age]),
        tf.zeros([ctx.numCategories]),
        tf.zeros([ctx.numColors])
    ]).reshape([1, ctx.dimentions]);
}

function createTrainingData(context) {
    const inputs = [];
    const labels = [];
    context.users
        .filter(u => u.purchases.length)
        .forEach(user => {
            const userVector = encodeUser(user, context).dataSync();
            context.products.forEach(product => {
                const productVector = encodeProduct(product, context).dataSync();
                const label = user.purchases.some(p => p.name === product.name) ? 1 : 0;
                inputs.push([...userVector, ...productVector]);
                labels.push(label);
            });
        });

    return {
        xs: tf.tensor2d(inputs),
        ys: tf.tensor2d(labels, [labels.length, 1]),
        inputDimensions: context.dimentions * 2,
    }
}

async function configureNeuralNetAndTrain(trainData) {
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [trainData.inputDimensions], units: 128, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

    model.compile({
        optimizer: tf.train.adam(0.01),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
    });

    await model.fit(trainData.xs, trainData.ys, {
        epochs: 100,
        batchSize: 32,
        shuffle: true,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                // console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
                postMessage({
                    type: workerEvents.trainingLog,
                    epoch: epoch + 1,
                    loss: logs.loss,
                    accuracy: logs.acc
                });
            }
        }
    });

    return model;
}

async function trainModel({ users }) {
    console.log('Training model with users:', users)

    postMessage({ type: workerEvents.progressUpdate, progress: { progress: 50 } });
    const catalog = await (await fetch('/data/products.json')).json();

    const context = makeContext(catalog, users);

    context.productVectors = catalog.map(product => {
        return {
            name: product.name,
            meta: { ...product },
            vector: encodeProduct(product, context).dataSync()
        }
    })

    _globalCtx = context;

    const trainData = createTrainingData(context);

    _model = await configureNeuralNetAndTrain(trainData);

    postMessage({
        type: workerEvents.trainingLog,
        epoch: 1,
        loss: 1,
        accuracy: 1
    });

    postMessage({ type: workerEvents.progressUpdate, progress: { progress: 100 } });
    postMessage({ type: workerEvents.trainingComplete });
}

function recommend(user, ctx) {
    if (!_model) {
        console.warn('Model not trained yet');
        return;
    }

    const context = ctx || _globalCtx;

    const userVector = encodeUser(user, context).dataSync();
    const inputs = context.productVectors.map(({vector}) => [...userVector, ...vector]);
    const inputTensor = tf.tensor2d(inputs);
    const predictions = _model.predict(inputTensor);
    const scores = predictions.dataSync();
    const recommendations = context.productVectors.map((item, index) => {
        return {
            ...item.meta,
            name: item.name,
            score: scores[index]
        }
    })
    .sort((a, b) => b.score - a.score)

    postMessage({
        type: workerEvents.recommend,
        user,
        recommendations: recommendations
    });
}


const handlers = {
    [workerEvents.trainModel]: trainModel,
    [workerEvents.recommend]: d => recommend(d.user, _globalCtx),
};

self.onmessage = e => {
    const { action, ...data } = e.data;
    if (handlers[action]) handlers[action](data);
};
