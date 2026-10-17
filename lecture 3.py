#LIST AND TUPLES 
# # # # # WAP TO ASK THE USER TO ENTER THIER FAV MOVIES AND STORE THEM IN A LIST
# # # # movies=[]
# # # # mov1=(input("enter your 1st movie name"))
# # # # mov2=(input("enter your 2nd movie name"))
# # # # mov3=(input("enter your 3rd movie name"))
# # # # movies.append(mov1)
# # # # movies.append(mov2)
# # # # movies.append(mov3) 
# # # # print(movies)

# # # #WAP TO CHEACK IF A LIST CONTAINCE A PALIDROME OF ELEMENTS (USE COPY METHOD)
# # # List1=[1,2,1,3]
# # # List2=List1.copy()
# # # List2.reverse()

# # # if List1==List2:
# # #     print("list is palindrome")
# # # else:
# # #     print("NOT palindrome")

# # tup1=("C","D","A","A","B","B","A")
# # count=tup1.count("A")
# # print("A grade in tuple is:", count)

# # #store the above values in list and sort them in ascending order
# # list1=list(tup1)
# # list1.sort()
# # print(list1)

# collection={1,2,3,4,5}
# print(type(collection))
# collection.add(6)


# collection.remove(3)
# #collection.clear()
# #collection.pop()
# print(collection)

#SET AND DICTONARIES

# set1={1,2,3}
# set2={2,3,4}
# print(set1.union(set2))
# print(set1.intersection(set2))

#STORE THE following word in python dictionarys
# dict={
    # "table": ["a pieace of furniture","list of facts and figuers"],
    # "cat":"a small animal"
    #   }
# print(dict)

#Your are given list of subjects for students assume one classroom needed for 1 subjects
#  so how many classroom needed for all students ??

# set1={"python","java","c++","python","javascript"}
# set2={"java","python","java","c++","c"}
# print(len(set1.union(set2)))
# print("students are needed classroom")


          
#WAP enter marks of 3 subjects from the user and store them in distionary
# start with and empty distionary
#add one by one use subject name as  key and marks as value 

# dist={}
# a=(input("enter marks for 1st subject "))
# b=(input("enter marks for 2nd subject "))
# c=(input("enter marks for 3rd subject "))
# 
# dist.update({"subject1": a})
# dist.update({"subject2": b})
# dist.update({"subject3": c})
# print(dist)

#set the 9 and 9.0 two diff values in set using data type
# set1={(9)},{float(9.0)}
# print(set1)

