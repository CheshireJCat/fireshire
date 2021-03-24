const { ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const listFileName = "list.json";
const debug = "--debug" === process.argv[1];

function blogPath(filename) {
  return path.join(debug ? "./_blogs_dev/" : "./blogs/", filename);
}

function readFile(filename) {
  let dir = blogPath(filename);
  console.log("blogs readFile", dir);
  return new Promise((resolve, reject) => {
    try {
      fs.readFile(dir, "utf-8", (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

function writeFile(filename, content) {
  let dir = blogPath(filename);
  console.log("blogs writeFile", dir);
  return new Promise((resolve, reject) => {
    try {
      fs.writeFile(dir, content, (err, data) => {
        if (err) {
          reject(err);
        }
        resolve(content);
      });
    } catch (err) {
      reject(err);
    }
  });
}

function existFile(filename) {
  let dir = blogPath(filename);
  console.log("blogs existFile", dir);
  return new Promise((resolve) => {
    fs.exists(dir, (exist) => {
      console.log("blogs existFile", dir, "-", exist);
      resolve(exist);
    });
  });
}

function removeFile(filename) {
  let dir = blogPath(filename);
  console.log("blogs removeFile", dir);
  return new Promise((resolve, reject) => {
    fs.unlink(dir, (err) => {
      if (err) {
        console.log(err);
        reject(err);
      }
      resolve();
    });
  });
}

async function getFile(filename, content) {
  let exist = await existFile(filename);
  if (!exist) {
    await writeFile(filename, content);
  }
  return readFile(filename);
}

function updateList(list, data) {
  let len = list.length;
  let exist = false;
  let { uuid } = data;
  for (let i = 0; i < len; i++) {
    if (list[i].uuid === uuid) {
      exist = true;
      list[i] = Object.assign(list[i], data);
    }
  }
  if (!exist) {
    list.push(data);
  }
  return list;
}

function removeItem(list, uuid) {
  let len = list.length;
  for (let i = 0; i < len; i++) {
    if (list[i].uuid === uuid) {
      list.splice(i, 1);
    }
  }
  return list;
}

function resErr(err) {
  return {
    code: err.code || -1,
    msg: err.toString(),
    data: [],
  };
}

async function getBlogList() {
  try {
    let list = await getFile(listFileName, "[]");
    if (typeof list == "string") {
      list = JSON.parse(list);
    }
    return {
      code: 0,
      msg: "success",
      data: list,
    };
  } catch (err) {
    return resErr(err);
  }
}

async function getMarkdown(uuid) {
  try {
    return {
      code: 0,
      msg: "success",
      data: await getFile(uuid + ".md", "[]"),
    };
  } catch (err) {
    return resErr(err);
  }
}

async function removeMarkdown(uuid) {
  try {
    let filename = uuid + ".md";
    let exist = await existFile(filename);
    if (exist) {
      await removeFile(filename);
    }
    return {
      code: 0,
      msg: "success",
    };
  } catch (err) {
    return resErr(err);
  }
}

async function updateMarkdown(uuid, content) {
  try {
    let filename = uuid + ".md";
    let exist = await existFile(filename);
    if (!exist) {
      await getFile(filename, "");
    }
    await writeFile(filename, content);
    return {
      code: 0,
      msg: "success",
    };
  } catch (err) {
    return resErr(err);
  }
}

async function updateBlog(data, content) {
  let { uuid } = data;
  try {
    let {data:list} = await getBlogList();
    list = updateList(list, data);
    await writeFile(listFileName, JSON.stringify(list));
    await updateMarkdown(uuid, content);
    return {
      code: 0,
      msg: "success",
    };
  } catch (err) {
    return resErr(err);
  }
}

async function deleteBlog(uuid) {
  try {
    let {data:list} = await getBlogList();
    list = removeItem(list, uuid);
    await writeFile(listFileName, JSON.stringify(list));
    await removeMarkdown(uuid);
    return {
      code: 0,
      msg: "success",
    };
  } catch (err) {
    return resErr(err);
  }
}

const createBlog = updateBlog;

function init() {
  ipcMain.handle("blog-list", async function (event) {
    const res = await getBlogList();
    console.log("blog-list:", res);
    return res;
  });

  ipcMain.handle("blog-create", async (event, data, content) => {
    const res = await createBlog(data, content);
    console.log("blog-create:", res);
    return res;
  });

  ipcMain.handle("blog-edit", function (event, data, content) {
    updateBlog(data, content);
  });

  ipcMain.handle("blog-del", function (event, uuid) {
    deleteBlog(uuid);
  });
}

module.exports = {
  getBlogList,
  getMarkdown,
  updateBlog,
  createBlog,
  deleteBlog,
  init,
};
