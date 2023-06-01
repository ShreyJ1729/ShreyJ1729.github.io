const updateAge = () => {
  const bday = new Date("Tue Aug 3 2004").getTime();
  const ageMs = Date.now() - bday;
  const age = ageMs / 1000 / 60 / 60 / 24 / 365.25;
  document.getElementById("age").innerHTML =
    "Current Age: <strong>" + age.toPrecision(10) + "</strong>";
  requestAnimationFrame(updateAge);
};

const OpenLinksInNewTab = () => {
  const links = document.getElementsByTagName("a");

  for (let i = 0; i < links.length; i++) {
    last = links[i].href.split("/").pop();

    if (!last.includes("#")) {
      links[i].target = "_blank";
    }
  }
};

const getNumberOfProjects = () => {
  const projects = document.getElementsByClassName("project-list")[0];
  const num_projects = projects.childElementCount;
  return num_projects;
};

OpenLinksInNewTab();
requestAnimationFrame(updateAge);
console.log("Website last updated: " + document.lastModified);
console.log("Number of projects: " + getNumberOfProjects());

document.getElementById("website-last-updated").innerHTML =
  "Website last updated: <b>" + document.lastModified + "</b>";

document.getElementById("year").innerHTML = new Date().getFullYear();

document.getElementById(
  "projects"
).firstElementChild.firstElementChild.innerHTML =
  "<u>Projects</u> <span style='font-size: 22px'>(" +
  getNumberOfProjects() +
  ")</span>";
