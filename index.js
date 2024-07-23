document.addEventListener("DOMContentLoaded", function() {
    const loginForm = document.getElementById("loginForm");
    const logoutButton = document.getElementById("logoutButton");
    const loggedInUser = localStorage.getItem("loggedInUser");

    if (loggedInUser) {
        logoutButton.style.display = "block";
    }

    if (loginForm) {
        loginForm.addEventListener("submit", function(event) {
            event.preventDefault();
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            fetch('https://bever-aca-assignment.azurewebsites.net/Users')
                .then(response => response.json())
                .then(data => {
                    const user = data.value.find(u => u.Name === username && u.Password === password);

                    if (user) {
                        localStorage.setItem("loggedInUser", user.UserId);
                        window.location.href = "invoices.html";
                    } else {
                        document.getElementById("error-message").innerText = "Invalid username or password";
                    }
                })
                .catch(error => console.error('Error:', error));
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", function() {
            localStorage.removeItem("loggedInUser");
            logoutButton.style.display = "none";
            window.location.href = "index.html";
        });
    }

    if (loggedInUser && window.location.pathname.endsWith("invoices.html")) {
        fetch('https://bever-aca-assignment.azurewebsites.net/Invoices')
            .then(response => response.json())
            .then(data => {
                const userInvoices = data.value.filter(invoice => invoice.UserId === loggedInUser);
                const invoiceTableBody = document.getElementById("invoiceTable").getElementsByTagName("tbody")[0];
                const invoiceLinesTableBody = document.getElementById("invoiceLinesTable").getElementsByTagName("tbody")[0];

                userInvoices.forEach(invoice => {
                    fetch(`https://bever-aca-assignment.azurewebsites.net/InvoiceLines?$filter=InvoiceId eq ${invoice.InvoiceId}`)
                        .then(response => response.json())
                        .then(linesData => {
                            const totalAmount = linesData.value.reduce((sum, line) => sum + line.Quantity, 0); 
                            const row = invoiceTableBody.insertRow();
                            const selectCell = row.insertCell(0);
                            const nameCell = row.insertCell(1);
                            const dateCell = row.insertCell(2);
                            const amountCell = row.insertCell(3);

                            const radioButton = document.createElement("input");
                            radioButton.type = "radio";
                            radioButton.name = "invoiceSelect";
                            radioButton.value = invoice.InvoiceId;
                            radioButton.addEventListener("change", function() {
                                displayInvoiceLines(invoice.InvoiceId);
                            });

                            selectCell.appendChild(radioButton);
                            nameCell.textContent = invoice.Name;
                            dateCell.textContent = new Date(invoice.PaidDate).toLocaleDateString();
                            amountCell.textContent = totalAmount;
                        });
                });

                function displayInvoiceLines(invoiceId) {
                    fetch(`https://bever-aca-assignment.azurewebsites.net/InvoiceLines?$filter=InvoiceId eq ${invoiceId}`)
                        .then(response => response.json())
                        .then(linesData => {
                            invoiceLinesTableBody.innerHTML = "";
                            linesData.value.forEach(line => {
                                fetch(`https://bever-aca-assignment.azurewebsites.net/Products?$filter=ProductId eq ${line.ProductId}`)
                                    .then(response => response.json())
                                    .then(productData => {
                                        const product = productData.value[0]; 
                                        const row = invoiceLinesTableBody.insertRow();
                                        const productCell = row.insertCell(0);
                                        const perUnitCell = row.insertCell(1);
                                        const quantityCell = row.insertCell(2);

                                        productCell.textContent = product.Name;
                                        perUnitCell.textContent = product.Price; 
                                        quantityCell.textContent = line.Quantity;
                                    });
                            });
                        });
                }
            })
            .catch(error => console.error('Error:', error));
    }
});
