def pytest_itemcollected(item):
    """
    Gắn docstring (nếu có) làm phần tên mô tả trong báo cáo
    """
    if item.function.__doc__:
        # Strip và lấy dòng đầu tiên trong docstring làm mô tả
        first_line = item.function.__doc__.strip().split('\n')[0]
        item._nodeid = first_line
