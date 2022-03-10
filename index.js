const updateAge = () => {
    const bday = new Date("Tue Aug 3 2004").getTime();
    const ageMs = Date.now() - bday
    const age = ageMs/1000/60/60/24/365.25
    document.getElementById("age").innerHTML = "Age: " + age.toPrecision(10);
    requestAnimationFrame(updateAge);
}

requestAnimationFrame(updateAge);
