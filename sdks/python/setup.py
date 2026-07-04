from setuptools import setup, find_packages

setup(
    name="chatbotstudio",
    version="0.1.0",
    description="Official ChatBot Studio Python SDK",
    long_description="Python client for ChatBot Studio REST API and widget embedding.",
    author="ChatBot Studio",
    packages=find_packages(),
    python_requires=">=3.8",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
    ],
)
