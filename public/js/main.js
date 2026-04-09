async function loadBlogs() {
const res = await fetch('/api/blogs');
const data = await res.json();

```
const container = document.getElementById('blog-container');
container.innerHTML = '';

data.forEach(blog => {
    container.innerHTML += `
        <div>
            <h3>${blog.title}</h3>
            <p>${blog.description}</p>
            <img src="${blog.image}" width="200"/>
        </div>
    `;
});
```

}

loadBlogs();

