// Firebase configuration
const firebaseConfig = {
    apiKey: "***",
    authDomain: "***",
    databaseURL: "***",
    projectId: "***",
    storageBucket: "***",
    messagingSenderId: "***",
    appId: "***",
    measurementId: "***"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        console.log("User logged in: ", user);
        loadCartItems();  // Call loadCartItems only if the user is logged in
    } else {
        console.log("No user logged in.");
        alert("Please log in first.");
    }
});

// Clear session storage
sessionStorage.clear();



// Function to dynamically load cart items from Firebases
function loadCartItems() {
    const cartRef = firebase.database().ref('Cart');  // Remove space here
    const cartItemsContainer = document.getElementById('cart-items');
    let totalPrice = 0;
    let srNo = 1;

    // Fetch cart data from Firebase
    cartRef.once('value', snapshot => {
        cartItemsContainer.innerHTML = ''; // Clear existing rows

        snapshot.forEach(childSnapshot => {
            const product = childSnapshot.val();
            const row = `
                <tr>
                    <td>${srNo++}</td>
                    <td>${product.Name}</td>
                    <td>${product.Model_no}</td>
                    <td class="item-price">Rs.${product.Price.toFixed(2)}</td>
                </tr>
            `;

            // Add the row to the table
            cartItemsContainer.innerHTML += row;

            // Calculate total price
            totalPrice += product.Price;
        });

        // Update the total price in the UI
        document.getElementById('total-price').innerText = totalPrice.toFixed(2);

        // Attach Razorpay payment handler after total is calculated
        setupRazorpay(totalPrice);
    }).catch((error) => {
        console.error('Error loading cart items:', error);
    });
}

function setupRazorpay(total) {
    const options = {
        "key": "****", 
        "amount": total * 100, // Amount in paise
        "currency": "INR",
        "name": "Smart Cart",
        "description": "Total Payment",
        "handler": function (response) {
            // Get the current user ID (assuming authentication)
            const user = firebase.auth().currentUser;
            if (!user) {
                alert("User not logged in. Please log in to complete the payment.");
                return;
            }

            const userId = user.uid;

            // Construct payment data
            const paymentData = {
                TransactionID: response.razorpay_payment_id,
                Amount: total,
                Method: "Razorpay",
                DateTime: new Date().toISOString()
            };

            // Store payment data in Firebase under the user's PaymentHistory
            firebase.database().ref(`userAccounts/${userId}/PaymentHistory`).push(paymentData)
                .then(() => {
                    alert("Payment successful! Payment ID: " + response.razorpay_payment_id);
                    
                })
                .catch(error => {
                    console.error("Error saving payment data:", error);
                    alert("Payment was successful, but we couldn't save the details. Please contact support.");
                });
        },
        "prefill": {
            "name": "Customer Name",
            "email": "customer@example.com",
            "contact": "1234567890"
        },
        "theme": {
            "color": "#F37254"
        }
    };

    const rzp = new Razorpay(options);

    document.getElementById('rzpButton').addEventListener('click', function () {
        rzp.open();
    });
}
