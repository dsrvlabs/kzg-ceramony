const bls = require('@noble/curves/bls12-381');
const crypto = require('crypto');
const os = require('os');

function generateRandom(){
    const [seconds, nanoseconds] = process.hrtime();
    const seed = os.hostname() + os.freemem() + seconds + nanoseconds;

    const hash = crypto.createHash('keccak256');
    hash.update(seed);
    const seedHash = hash.digest();
    const seedInt = seedHash.readInt32LE();

    randomBytes = crypto.randomBytes(32);
    const randomInt = (parseInt(randomBytes.toString('hex'), 16) + seedInt);
    const randomBigInt = BigInt(randomInt);
    return randomBigInt % Fr.ORDER;
}

// TODO: Confirm by initialContribution.json
// TODO: Support multi-thread?
function contribute(contributions, rand) {
    console.log('updatePowerOfTau', rand);

    const G1Point = bls.bls12_381.G1.ProjectivePoint;
    const G2Point = bls.bls12_381.G2.ProjectivePoint;

    const G1 = bls.bls12_381.CURVE.G1;
    const G2 = bls.bls12_381.CURVE.G2;
    const Fr = bls.bls12_381.CURVE.Fr;

    const util = bls.bls12_381.utils;

    for(var i = 0; i < contributions.length; i++) {
        const g1Powers = contributions[i].powersOfTau.G1Powers;
        const g2Powers = contributions[i].powersOfTau.G2Powers;

        for(var j = 0; j < contributions[i].numG1Powers; j++) {
            const g1Affine = g1Powers[j];
            const g1PrjPoint = G1Point.fromAffine(g1Affine);

            const g1NewPrjPoint = g1PrjPoint.multiply(rand[i]);
            const g1NewAffine = g1NewPrjPoint.toAffine();

            contributions[i].powersOfTau.G1Powers[j] = g1NewAffine;

            if (j < contributions[i].numG2Powers) {
                const g2Affine = g2Powers[j];
                const g2PrjPoint = G2Point.fromAffine(g2Affine);

                const g2NewPrjPoint = g2PrjPoint.multiply(rand[i]);
                const g2NewAffine = g2NewPrjPoint.toAffine();

                contributions[i].powersOfTau.G2Powers[j] = g2NewAffine;
            }

            xi = (xi * rand) % Fr.ORDER;
        }
    };

    return contributions;
}

function updateWitness(contributions, rand) {

    for(var i = 0; i < contributions.length; i++) {
        const potPubkey = contributions[i].potPubkey;
        const hexStr = potPubkey.substring(2);

        // PotPub -> G2Affine
        const util = bls.bls12_381.utils;
        const hex = util.hexToBytes(hexStr);

        const G2 = bls.bls12_381.CURVE.G2;
        const G2Point = bls.bls12_381.G2.ProjectivePoint;

        const potPubkeyAffine = G2.fromBytes(hex);
        console.log(potPubkeyAffine);

        const potPubkeyPrj = G2Point.fromAffine(potPubkeyAffine);
        const newPubkeyPrj = potPubkeyPrj.multiply(rand[i])

        const newPotPubkey = util.bytesToHex(G2.toBytes(G2Point, newPubkeyPrj, true));
        console.log('New PotPubkey', newPotPubkey);

        contributions[i].potPubkey = '0x' + newPotPubkey;
    }

    return contributions;
}

module.exports = {
    contribute: contribute,
    updateWitness: updateWitness,
    generateRandom: generateRandom,
};
