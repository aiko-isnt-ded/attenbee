# Functional Requirements

## Frontend

- Main Page
    - [] **_Create Order_** Page
    - [] **_Open Orders_** Page
    - [] **_Checkout_** Page
    - [] **_Add Product_** Page
    - [] **_Edit Product_** Page
- _Create Order_ Page
    - [] Connect to SQLite database and create a new instance in _Orders_ Table and add initial values
    - [] Possible pop-up to specify order information (products, quantity, additional info...)
- _Check Open Orders_ Page
    - [] Constant view of open orders
    - [] Edit values of open orders
- _Checkout_ Page
    - [] Tabulate the order price 
    - [] Tabulate change required  
    - [] Store tips as a manual input from the cashier
- _Add Product_ Page
    - [] Add new products in _Products_ Table
- _Edit Product_ Page
    - [] Edit product name/price in _Products_ Table based on ID
    - [] Delete product in _Products_ Table based on ID. **Confirm with user first**
    - [] Prevent product modification/deletion if it's in an active order

## Backend
- [] Seamless communication with database 

- [] Simple queries for business intelligence

## Database Management
Via SQLite
|Products| Data Type |
|----| --- |
|ID_Product [PK]| INTEGER |
|Product_Name| TEXT |
|Price| REAL |
