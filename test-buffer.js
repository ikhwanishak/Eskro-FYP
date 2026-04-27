try {
    const id = "4Cwp2Tw1fVuirRvACecVTHjvscsgUQSWsJWxoj6CnM0";
    console.log("Testing Buffer.from with base64url...");
    const buf = Buffer.from(id, 'base64url');
    console.log("Success:", buf);
} catch (e) {
    console.error("Error:", e);
}
