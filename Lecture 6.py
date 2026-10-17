# #functions in python 
# def calc_sum(a,b):
#     sum=a+b
#     print(sum)
#     return(sum)
# calc_sum(5,10)
# calc_sum(15,35)
# calc_sum(16,25)

# def sum(a,b):
#     return a+b
# def sub(a,b):
#     return a-b
# sum(5,10)
# sum(30,50)
# sub(10,5)
# sub(50,30)
# print("sum of two no",sum(5,10))
# print("sum of two no",sum(30,50))
# print("sub of two no",sub(10,5))
# print("sub of two no",sub(50,30))

#print avg of three numbers 
# def avg(a,b,c):
#     return(a+b+c/3)
# print("avg of three no",avg(5,10,15))


#PRCTICE QUESTIONS

 #print the lenght of list using function
# car=["benz","maruti","hundai"]
# num=[22,11,22,33,23,122,135,87]
# def len_list(car):
#     return len(car)
# print("lenght of list",len_list(car))
# print("lenght of list", len_list(num))


#wap to print elements of a list in single line
# def print_list(lst):
#     for item in lst:
#         print(item, end=" ")
# fruits = ["apple", "banana", "mango", "orange"]
# print_list(fruits)



#WAF TO FIND OF N (N IN THE PARAMETER)
# def cal_fact(n):
#     fact=1
#     for i in range(1,1+n):
#         fact *= i
#     print(fact)
# cal_fact(5)


#WAP TO CALCULATE CSD TO inr
# def usd_to_inr(usd):
#     rate=93
#     inr=usd*rate
#     print(inr)
# usd_to_inr(10)


#WAF INPUT A NO IF NO IS ODD PRINT ODD AND IF EVEN PRINT EVEN
# def cheack_number(n):
#     rem=n%2
#     if (rem==0):
#         print("even")
#     else:
#         print("ODD")
# cheack_number(10)
# cheack_number(9)

# #RECURSION example 
# def show(n):
#     if(n==0):
#         return
#     print(n)
#     show(n-1)

# show(5)

#print sum of n numbers using recursion function

# def calc_sum(n):
#     if (n==0):
#          return 0
#     return calc_sum (n-1) + n

# sum=calc_sum(5)
# print(sum)

# using recursion function print all elements in the list 
# def print_list(list, idx=0):
#     if(idx == len(list)):
#         return
#     print(list[idx])
#     print_list(list, idx+1)

# fruits=["mango","banana","apple","waterlemon"]

# print_list(fruits)

