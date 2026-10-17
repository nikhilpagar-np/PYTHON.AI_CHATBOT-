#LECTURE 5
#LOOPS

#WHILE
# i=1
# while i<=5:
    # print(i)
    # i+=1

# print(i)

#print no from 100 to 1
# i=100
# while i>=1:
    # print(i)
    # i -= 1

# print("loop ended")

#print the multiplication table of no n
# n=(int(input("enter the no: ")))
# i=1
# while i<=10:
    # print(n*i)
    # i+=1

#print the following elements list using loops
# 
# nums=["1","4","9","16","25","36"]
# heroes=["spiderman","ironman","captain america","thor"]
# i=0
# while i<len(heroes):
    # print(heroes[i])
    # i+=1
#
#serch for no x in this tuple using oops 
# nums=(1,2,4,44,23,56,78,99,100)
# x=99
# i=0
# while i<len(nums):
    # if(nums[i]==x):
        # print("found at idx",i)
    # i+=1

#print the elements of the following list using for loop
# nums=[1,4,9,16,25,36,49,64,81,100]
# for el in nums:
    # print(el)

#serch for numbers x in this tuple
# num=[1,4,66,23,49,67,84,100]
# x=84
# i=0
# for el in num:
#     if (el==x):
#         print("found at idx",num.index(el))
#         break

# Search for number x in this tuple and stop when found

# num = (1, 4, 66, 23, 49, 67, 84, 100)
# x = 23

# for i, el in enumerate(num):
#     if el == x:
#         print("found at idx", i)
#         break  # Stops the loop immediately without reading the rest
# num = (1, 4, 66, 23, 49, 67, 84, 100)
# x = 23

# for i,el in enumerate(num):
#     print(el)
#     if el==x:
#         print("found at idx",i)
#         break 

# for i, el in enumerate(num):
#     print(el)  # २३ पर्यंतचे सर्व नंबर्स प्रिंट करण्यासाठी
#     if el == x:
#         print("found at idx", i)
#         break  # इथे कोड थांबेल आणि पुढचे नंबर्स (४९, ६७...) वाचणार नाही

#WAP TO FIND THE SUM OF N NUMBERS (USING WHILE LOOPS)
# n=5
# sum=0
# for i in range(1,n+1):
    # sum+=i
    # print("sum of  total no=",sum)

#wap to find factorial of first n numbers (USING FOR LOOPS)
# n=5
# fact=1

# for i in range(1,n+1):
    # fact*=i
    # print("factorial=",fact)
